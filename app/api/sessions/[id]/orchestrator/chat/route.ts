import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callClaude } from "@/lib/claude";
import { applyActions, sanitizeActions } from "@/lib/orchestrator/actions";
import type { DebateSessionState, OrchestratorMessage } from "@/lib/types/session";

export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { message } = (await req.json()) as { message: string };
    if (!message?.trim()) {
      return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });
    }

    const session = await prisma.debateSession.findUniqueOrThrow({ where: { id } });
    const state = session.state as unknown as DebateSessionState;
    const threads = state.A3?.threads ?? [];
    const chat = state.orchestratorChat ?? [];

    const summary = threads.map((t) => ({
      number: t.index + 1,
      threadId: t.id,
      label: t.studentLabel ?? `학생${t.index + 1}`,
      status: t.status,
      position: t.position,
      turnCount: t.turns.length,
      studentTurnCount: Math.floor(t.turns.length / 2),
      gradeOverride: state.gradeOverrides?.[t.id] ?? null,
      teacherNotes: state.teacherNotes?.[t.id] ?? [],
      currentGrade: state.A5?.perStudent.find((p) => p.threadId === t.id)?.grade ?? null,
    }));

    const recentChat = chat.slice(-6);
    const chatLog = recentChat
      .map((m) => `[${m.role === "teacher" ? "교사" : "AI"}] ${m.text}`)
      .join("\n");

    const chosenProblem = state.A1?.problems.find((p) => p.id === state.A1?.chosen);
    const system = await readFile(path.join(process.cwd(), "prompts/orchestrator-chat.md"), "utf-8");
    const user = `
## 수업 정보
- 주제: ${state.meta.topic}
- 학습문제: ${chosenProblem?.text ?? "(미선택)"}
- 단계: ${session.stage}
- 토론 수준: ${state.A3?.level ?? "중급"}

## 현재 학생 상태
${summary.map((s) => `- ${s.number}번 (${s.label}): ${s.status}, 입장 ${s.position ?? "미선택"}, 학생 발언 ${s.studentTurnCount}회${s.currentGrade ? `, 평가 ${s.currentGrade}` : ""}${s.gradeOverride ? ` (교사 오버라이드 ${s.gradeOverride})` : ""}${s.teacherNotes.length ? ` / 메모: ${s.teacherNotes.join(", ")}` : ""}`).join("\n")}

${recentChat.length ? `## 최근 대화 (참고용)\n${chatLog}\n` : ""}
## 교사의 새 메시지
${message.trim()}

위 상황을 분석하고 JSON({reply, actions})으로만 답변하세요.
`.trim();

    const raw = await callClaude({ system, user, responseFormat: "json", maxTokens: 1024 });
    let parsed: { reply?: string; actions?: unknown };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { reply: raw, actions: [] };
    }

    const reply = typeof parsed.reply === "string" && parsed.reply.trim()
      ? parsed.reply.trim()
      : "죄송합니다, 답변을 생성하지 못했습니다.";
    const actions = sanitizeActions(parsed.actions);

    const now = new Date().toISOString();
    const teacherMsg: OrchestratorMessage = { role: "teacher", text: message.trim(), ts: now };
    const aiMsg: OrchestratorMessage = { role: "ai", text: reply, ts: new Date().toISOString(), actions };

    let newState: DebateSessionState = {
      ...state,
      orchestratorChat: [...chat, teacherMsg, aiMsg],
    };
    newState = applyActions(newState, actions);

    await prisma.debateSession.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { state: JSON.parse(JSON.stringify(newState)) as any },
    });

    return NextResponse.json({ reply, actions, chat: newState.orchestratorChat });
  } catch (err) {
    console.error("Orchestrator chat error:", err);
    const msg = err instanceof Error ? err.message : "오케스트레이터 채팅 중 오류가 발생했습니다.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
