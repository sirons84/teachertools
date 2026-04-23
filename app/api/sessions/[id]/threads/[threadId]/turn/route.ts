import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runA3Turn } from "@/lib/agents/a3-debate";
import type { DebateSessionState, Turn } from "@/lib/types/session";

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  try {
    const { id, threadId } = await params;
    const { text, phase } = (await req.json()) as { text: string; phase: Turn["phase"] };

    if (!text?.trim()) {
      return NextResponse.json({ error: "발언 내용을 입력해주세요." }, { status: 400 });
    }

    const session = await prisma.debateSession.findUniqueOrThrow({
      where: { id },
      include: { turns: { orderBy: { order: "asc" } } },
    });

    const state = session.state as unknown as DebateSessionState;
    const threads = state.A3?.threads ?? [];
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return NextResponse.json({ error: "쓰레드를 찾을 수 없습니다." }, { status: 404 });
    if (!thread.position) {
      return NextResponse.json({ error: "먼저 찬성/반대 입장을 선택해주세요." }, { status: 400 });
    }
    if (thread.status === "finished") {
      return NextResponse.json({ error: "이미 종료된 토론입니다. 새로 시작하려면 '다시 시작'을 눌러주세요." }, { status: 400 });
    }

    const studentPosition = thread.position;
    const botPosition = studentPosition === "찬성" ? "반대" : "찬성";
    const now = new Date().toISOString();

    const studentTurn: Turn = {
      id: `t${thread.turns.length + 1}`,
      speaker: "student",
      side: studentPosition,
      phase,
      text: text.trim(),
    };

    const botResponse = await runA3Turn(state, thread, text.trim(), phase);

    const botTurn: Turn = {
      id: `t${thread.turns.length + 2}`,
      speaker: "bot",
      side: botPosition,
      phase,
      text: botResponse,
    };

    const updatedThreads = threads.map((t) =>
      t.id === threadId
        ? { ...t, turns: [...t.turns, studentTurn, botTurn], status: "active" as const, lastActivityAt: now }
        : t
    );

    const newState: DebateSessionState = {
      ...state,
      A3: { ...state.A3!, threads: updatedThreads },
    };

    const nextOrder = session.turns.length;
    await prisma.$transaction([
      prisma.debateTurn.create({
        data: { sessionId: id, threadId, order: nextOrder, speaker: "student", side: studentPosition, phase, text: text.trim() },
      }),
      prisma.debateTurn.create({
        data: { sessionId: id, threadId, order: nextOrder + 1, speaker: "bot", side: botPosition, phase, text: botResponse },
      }),
      prisma.debateSession.update({
        where: { id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { state: JSON.parse(JSON.stringify(newState)) as any, stage: "A3_RUNNING" },
      }),
    ]);

    return NextResponse.json({ studentTurn, botTurn });
  } catch (err) {
    console.error("Thread turn error:", err);
    const msg = err instanceof Error ? err.message : "토론 턴 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
