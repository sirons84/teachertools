import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runNext } from "@/lib/orchestrator/run";
import type { DebateSessionState } from "@/lib/types/session";

export const maxDuration = 120;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await prisma.debateSession.findUniqueOrThrow({ where: { id } });
    const state = session.state as unknown as DebateSessionState;

    const resetState: DebateSessionState = { ...state, A1: undefined };
    await prisma.debateSession.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { stage: "A1_READY", state: JSON.parse(JSON.stringify(resetState)) as any },
    });

    const result = await runNext(id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Rerun A1 error:", err);
    const msg = err instanceof Error ? err.message : "재제안 중 오류가 발생했습니다.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
