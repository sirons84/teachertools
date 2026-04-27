import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import type {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from "openai/resources/chat/completions";
import { prisma } from "@/lib/db";
import { getOpenAI } from "@/lib/openai";
import {
  ORCHESTRATOR_TOOLS,
  executeTool,
} from "@/lib/agents/orchestrator-llm";
import type {
  DebateSessionState,
  OrchestratorMessage,
  OrchestratorToolCall,
} from "@/lib/types/session";

export const maxDuration = 300;

const MAX_TOOL_ROUNDS = 6;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { message } = (await req.json()) as { message: string };
    if (!message?.trim()) {
      return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });
    }

    const session = await prisma.debateSession.findUniqueOrThrow({ where: { id } });
    const state = session.state as unknown as DebateSessionState;
    const chat = state.orchestratorChat ?? [];

    const systemPrompt = await readFile(
      path.join(process.cwd(), "prompts/orchestrator-chat.md"),
      "utf-8",
    );

    const stateContext = buildStateContext(state, session.stage);

    const llmMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "system", content: stateContext },
      ...chat.slice(-12).map(toLLMMessage),
      { role: "user", content: message.trim() },
    ];

    const openai = getOpenAI();
    const toolCallsRecord: OrchestratorToolCall[] = [];
    let finalText = "";

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: llmMessages,
        tools: ORCHESTRATOR_TOOLS,
        tool_choice: "auto",
        temperature: 0.5,
        max_tokens: 1024,
      });

      const choice = completion.choices[0]?.message;
      if (!choice) break;

      if (choice.tool_calls && choice.tool_calls.length > 0) {
        llmMessages.push({
          role: "assistant",
          content: choice.content ?? "",
          tool_calls: choice.tool_calls,
        });

        for (const tc of choice.tool_calls) {
          if (tc.type !== "function") continue;
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments || "{}");
          } catch {
            args = {};
          }
          const result = await executeTool(tc.function.name, args, { sessionId: id });
          toolCallsRecord.push({
            name: tc.function.name,
            status: result.ok ? "ok" : "error",
            summary: result.summary,
          });
          const toolMsg: ChatCompletionToolMessageParam = {
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({
              ok: result.ok,
              summary: result.summary,
              data: result.data ?? null,
            }),
          };
          llmMessages.push(toolMsg);
        }
        continue;
      }

      finalText = (choice.content ?? "").trim();
      break;
    }

    if (!finalText) {
      finalText = toolCallsRecord.length
        ? "처리했어요. 다음에 무엇을 할까요?"
        : "죄송합니다, 답변을 생성하지 못했습니다.";
    }

    const refreshed = await prisma.debateSession.findUniqueOrThrow({ where: { id } });
    const refreshedState = refreshed.state as unknown as DebateSessionState;
    const now = new Date().toISOString();
    const teacherMsg: OrchestratorMessage = { role: "teacher", text: message.trim(), ts: now };
    const aiMsg: OrchestratorMessage = {
      role: "ai",
      text: finalText,
      ts: new Date().toISOString(),
      toolCalls: toolCallsRecord.length ? toolCallsRecord : undefined,
    };

    const newState: DebateSessionState = {
      ...refreshedState,
      orchestratorChat: [...(refreshedState.orchestratorChat ?? []), teacherMsg, aiMsg],
    };

    await prisma.debateSession.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { state: JSON.parse(JSON.stringify(newState)) as any },
    });

    return NextResponse.json({
      reply: finalText,
      toolCalls: toolCallsRecord,
      chat: newState.orchestratorChat,
    });
  } catch (err) {
    console.error("Orchestrator chat error:", err);
    const msg = err instanceof Error ? err.message : "오케스트레이터 채팅 중 오류가 발생했습니다.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function toLLMMessage(m: OrchestratorMessage): ChatCompletionMessageParam {
  if (m.role === "teacher") {
    return { role: "user", content: m.text };
  }
  return { role: "assistant", content: m.text };
}

function buildStateContext(state: DebateSessionState, stage: string): string {
  const lines: string[] = [];
  lines.push(`## 현재 세션 상태`);
  lines.push(`- 단계: ${stage}`);
  if (state.meta?.topic || state.meta?.grade) {
    lines.push(`- 주제: ${state.meta.topic || "(미설정)"}`);
    if (state.meta.grade) lines.push(`- 학년: ${state.meta.grade}`);
    if (state.meta.semester) lines.push(`- 학기: ${state.meta.semester}`);
    if (state.meta.subject) lines.push(`- 교과: ${state.meta.subject}`);
    if (state.meta.publisher) lines.push(`- 교과서: ${state.meta.publisher}`);
    if (state.meta.mainUnit) lines.push(`- 대단원: ${state.meta.mainUnit}`);
  } else {
    lines.push(`- 주제: (미설정)`);
  }

  if (state.A1?.problems?.length) {
    lines.push(`\n## 학습문제 후보 (A1)`);
    for (const p of state.A1.problems) {
      const mark = state.A1.chosen === p.id ? " ★ 선택됨" : "";
      lines.push(`- id=${p.id} (${p.score}점)${mark}: ${p.text}`);
    }
  }

  if (state.A2) {
    lines.push(`\n## 지도안·루브릭 (A2)`);
    lines.push(`- 생성됨 (lessonPlan ${state.A2.lessonPlan.length}자, rubric ${state.A2.rubric.criteria.length}개 항목)`);
  }

  if (state.A3?.threads?.length) {
    lines.push(`\n## 토론 스레드 (A3, level=${state.A3.level})`);
    for (const t of state.A3.threads) {
      const studentTurns = Math.floor(t.turns.length / 2);
      lines.push(`- ${t.index + 1}번: ${t.status}, 입장 ${t.position ?? "미선택"}, 학생 발언 ${studentTurns}회`);
    }
  }

  if (state.A4?.perStudent?.length) {
    lines.push(`\n## 관찰 결과 (A4)`);
    lines.push(`- 5명 관찰 점수 산출 완료`);
  }

  if (state.A5?.perStudent?.length) {
    lines.push(`\n## 평가 결과 (A5)`);
    for (let i = 0; i < state.A5.perStudent.length; i++) {
      const p = state.A5.perStudent[i];
      lines.push(`- ${i + 1}번: ${p.grade} (${p.totalScore}/100)`);
    }
  }

  if (state.A6?.perStudent?.length) {
    lines.push(`\n## 생기부 (A6)`);
    lines.push(`- 5명 초안 작성 완료`);
  }

  return lines.join("\n");
}
