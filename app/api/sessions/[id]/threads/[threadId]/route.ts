import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { DebateSessionState } from "@/lib/types/session";

export const maxDuration = 15;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; threadId: string }> }
) {
  try {
    const { id, threadId } = await params;
    const session = await prisma.debateSession.findUnique({ where: { id } });
    if (!session) return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 });

    const state = session.state as unknown as DebateSessionState;
    const thread = state.A3?.threads?.find((t) => t.id === threadId);
    if (!thread) return NextResponse.json({ error: "쓰레드를 찾을 수 없습니다." }, { status: 404 });

    return NextResponse.json({
      sessionId: id,
      topic: session.topic,
      grade: session.grade,
      subject: session.subject,
      learningProblem: state.A1?.problems.find((p) => p.id === state.A1?.chosen)?.text ?? null,
      level: state.A3?.level ?? "중급",
      thread,
    });
  } catch (err) {
    console.error("Thread get error:", err);
    return NextResponse.json({ error: "쓰레드 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
