import { NextRequest, NextResponse } from "next/server";
import { runNext } from "@/lib/orchestrator/run";

export const maxDuration = 120;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({})) as {
      chosenProblem?: string;
      level?: string;
      studentPosition?: string;
    };

    if (body.chosenProblem || body.level || body.studentPosition) {
      const { prisma } = await import("@/lib/db");
      const session = await prisma.debateSession.findUniqueOrThrow({ where: { id } });
      const state = session.state as Record<string, unknown>;

      const updates: Record<string, unknown> = {};
      if (body.chosenProblem) {
        updates.A1 = { ...(state.A1 as object ?? {}), chosen: body.chosenProblem };
      }
      if (body.level || body.studentPosition) {
        updates.A3 = {
          ...(state.A3 as object ?? {}),
          level: body.level ?? "중급",
          studentPosition: body.studentPosition ?? "찬성",
          turns: [],
        };
      }
      if (Object.keys(updates).length) {
        await prisma.debateSession.update({
          where: { id },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: { state: { ...state, ...updates } as any },
        });
      }
    }

    const result = await runNext(id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Run error:", err);
    const msg = err instanceof Error ? err.message : "에이전트 실행 중 오류가 발생했습니다.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
