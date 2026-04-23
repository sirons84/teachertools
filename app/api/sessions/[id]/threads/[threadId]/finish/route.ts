import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { DebateSessionState } from "@/lib/types/session";

export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  try {
    const { id, threadId } = await params;
    const session = await prisma.debateSession.findUniqueOrThrow({ where: { id } });
    const state = session.state as unknown as DebateSessionState;
    const threads = state.A3?.threads ?? [];
    const target = threads.find((t) => t.id === threadId);
    if (!target) return NextResponse.json({ error: "쓰레드를 찾을 수 없습니다." }, { status: 404 });

    const now = new Date().toISOString();
    const updatedThreads = threads.map((t) =>
      t.id === threadId ? { ...t, status: "finished" as const, lastActivityAt: now } : t
    );

    const newState: DebateSessionState = {
      ...state,
      A3: { ...state.A3!, threads: updatedThreads },
    };

    await prisma.debateSession.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { state: JSON.parse(JSON.stringify(newState)) as any },
    });

    return NextResponse.json({ thread: updatedThreads.find((t) => t.id === threadId) });
  } catch (err) {
    console.error("Thread finish error:", err);
    return NextResponse.json({ error: "종료 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
