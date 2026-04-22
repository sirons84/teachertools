import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runA3Turn } from "@/lib/agents/a3-debate";
import type { DebateSessionState, Turn } from "@/lib/types/session";

export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { text, phase } = (await req.json()) as { text: string; phase: Turn["phase"] };

    if (!text?.trim()) {
      return NextResponse.json({ error: "발언 내용을 입력해주세요." }, { status: 400 });
    }

    const session = await prisma.debateSession.findUniqueOrThrow({
      where: { id },
      include: { turns: { orderBy: { order: "asc" } } },
    });

    const state = session.state as unknown as DebateSessionState;
    const studentPosition = state.A3?.studentPosition ?? "찬성";
    const botPosition = studentPosition === "찬성" ? "반대" : "찬성";
    const currentTurns = state.A3?.turns ?? [];

    const studentTurn: Turn = {
      id: `t${currentTurns.length + 1}`,
      speaker: "student",
      side: studentPosition,
      phase,
      text: text.trim(),
    };

    const botResponse = await runA3Turn(state, text.trim(), phase);

    const botTurn: Turn = {
      id: `t${currentTurns.length + 2}`,
      speaker: "bot",
      side: botPosition,
      phase,
      text: botResponse,
    };

    const newTurns = [...currentTurns, studentTurn, botTurn];
    const newState: DebateSessionState = {
      ...state,
      A3: { ...state.A3!, turns: newTurns },
    };

    const nextOrder = session.turns.length;
    await prisma.$transaction([
      prisma.debateTurn.create({
        data: { sessionId: id, order: nextOrder, speaker: "student", side: studentPosition, phase, text: text.trim() },
      }),
      prisma.debateTurn.create({
        data: { sessionId: id, order: nextOrder + 1, speaker: "bot", side: botPosition, phase, text: botResponse },
      }),
      prisma.debateSession.update({
        where: { id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { state: JSON.parse(JSON.stringify(newState)) as any, stage: "A3_RUNNING" },
      }),
    ]);

    return NextResponse.json({ studentTurn, botTurn });
  } catch (err) {
    console.error("Debate turn error:", err);
    const msg = err instanceof Error ? err.message : "토론 턴 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
