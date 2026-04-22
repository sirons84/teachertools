import { NextRequest, NextResponse } from "next/server";
import { approveSession } from "@/lib/orchestrator/run";
import { prisma } from "@/lib/db";

export const maxDuration = 30;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { comment, chosenProblem } = (await req.json().catch(() => ({}))) as {
      comment?: string;
      chosenProblem?: string;
    };

    if (chosenProblem) {
      const session = await prisma.debateSession.findUniqueOrThrow({ where: { id } });
      const state = session.state as Record<string, unknown>;
      await prisma.debateSession.update({
        where: { id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { state: { ...state, A1: { ...(state.A1 as object ?? {}), chosen: chosenProblem } } as any },
      });
    }

    const result = await approveSession(id, comment);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Approve error:", err);
    const msg = err instanceof Error ? err.message : "승인 중 오류가 발생했습니다.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
