import { NextRequest, NextResponse } from "next/server";
import { runNext } from "@/lib/orchestrator/run";
import { prisma } from "@/lib/db";

export const maxDuration = 120;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({})) as {
      chosenProblem?: string;
      level?: string;
      studentPosition?: string;
    };

    const session = await prisma.debateSession.findUniqueOrThrow({ where: { id } });
    const state = session.state as Record<string, unknown>;

    // A1 선택 문제 반영
    if (body.chosenProblem) {
      await prisma.debateSession.update({
        where: { id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { state: { ...state, A1: { ...(state.A1 as object ?? {}), chosen: body.chosenProblem } } as any },
      });
    }

    // A3 설정 반영. A2_DONE 상태면 A3_READY로 먼저 전환 후 runNext
    if (body.level || body.studentPosition) {
      const a3Config = {
        level: body.level ?? "중급",
        studentPosition: body.studentPosition ?? "찬성",
        turns: [],
      };
      const updatedState = { ...state, A3: a3Config };
      const nextStage = session.stage === "A2_DONE" ? "A3_READY" : session.stage;
      await prisma.debateSession.update({
        where: { id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { state: updatedState as any, stage: nextStage },
      });
    }

    const result = await runNext(id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Run error:", err);
    const msg = err instanceof Error ? err.message : "에이전트 실행 중 오류가 발생했습니다.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
