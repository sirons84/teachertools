import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callClaude } from "@/lib/claude";
import type { DebateSessionState } from "@/lib/types/session";

export const maxDuration = 30;

interface OrchestratorResult {
  overall: string;
  nextAction: string;
  perThread: Array<{ threadId: string; level: "info" | "warn" | "success"; msg: string }>;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await prisma.debateSession.findUniqueOrThrow({ where: { id } });
    const state = session.state as unknown as DebateSessionState;
    const threads = state.A3?.threads ?? [];

    if (threads.length === 0) {
      return NextResponse.json({
        overall: "아직 토론방이 만들어지지 않았습니다.",
        nextAction: "A3에서 QR을 먼저 생성해주세요.",
        perThread: [],
      } satisfies OrchestratorResult);
    }

    const now = Date.now();
    const summary = threads.map((t) => {
      const lastTurn = t.turns[t.turns.length - 1];
      const lastTurnPreview = lastTurn ? `${lastTurn.speaker === "student" ? "학생" : "AI"}[${lastTurn.phase}]: ${lastTurn.text.slice(0, 60)}` : "(대화 없음)";
      const stalledSec = t.lastActivityAt ? Math.round((now - Date.parse(t.lastActivityAt)) / 1000) : null;
      return {
        threadId: t.id,
        index: t.index + 1,
        label: t.studentLabel ?? `학생${t.index + 1}`,
        status: t.status,
        position: t.position,
        turnCount: t.turns.length,
        lastActivitySecAgo: stalledSec,
        lastTurnPreview,
      };
    });

    const chosenProblem = state.A1?.problems.find((p) => p.id === state.A1?.chosen);

    const system = await readFile(path.join(process.cwd(), "prompts/orchestrator.md"), "utf-8");
    const user = `
## 수업 정보
- 주제: ${state.meta.topic}
- 학습문제: ${chosenProblem?.text ?? "(미선택)"}
- 단계: ${session.stage}
- 토론 수준: ${state.A3?.level ?? "중급"}

## 현재 쓰레드 상태 (5명)
${summary.map((s) => `
### [${s.index}] ${s.label} (threadId: ${s.threadId})
- 상태: ${s.status}
- 입장: ${s.position ?? "미선택"}
- 학생 턴 수: ${Math.floor(s.turnCount / 2)}회 (총 ${s.turnCount} turn)
- 마지막 활동: ${s.lastActivitySecAgo !== null ? `${s.lastActivitySecAgo}초 전` : "없음"}
- 최근 발언: ${s.lastTurnPreview}
`).join("\n")}

위 상태를 분석하고 JSON으로만 답변하세요.
`.trim();

    const raw = await callClaude({ system, user, responseFormat: "json", maxTokens: 1024 });
    const parsed = JSON.parse(raw) as OrchestratorResult;
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Orchestrator error:", err);
    return NextResponse.json({
      overall: "오케스트레이터 분석 중 오류가 발생했습니다.",
      nextAction: "잠시 후 다시 시도해주세요.",
      perThread: [],
    } satisfies OrchestratorResult, { status: 200 });
  }
}
