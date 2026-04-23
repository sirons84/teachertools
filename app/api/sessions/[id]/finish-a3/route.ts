import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { DebateSessionState } from "@/lib/types/session";

export const maxDuration = 30;

// 교사가 A3 전체 토론 종료. 아직 active인 쓰레드도 finished로 전환.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await prisma.debateSession.findUniqueOrThrow({ where: { id } });
    const state = session.state as unknown as DebateSessionState;
    const threads = state.A3?.threads ?? [];

    const now = new Date().toISOString();
    const finished = threads.map((t) =>
      t.status === "pending" ? t : { ...t, status: "finished" as const, lastActivityAt: now }
    );

    const newState: DebateSessionState = {
      ...state,
      A3: { ...state.A3!, threads: finished },
    };

    await prisma.debateSession.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { state: JSON.parse(JSON.stringify(newState)) as any, stage: "A3_DONE" },
    });

    return NextResponse.json({ stage: "A3_DONE" });
  } catch (err) {
    console.error("Finish A3 error:", err);
    return NextResponse.json({ error: "토론 종료 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
