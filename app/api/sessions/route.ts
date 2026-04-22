import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { DebateSessionState } from "@/lib/types/session";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { topic, grade, subject } = (await req.json()) as {
      topic: string;
      grade?: string;
      subject?: string;
    };

    if (!topic?.trim()) {
      return NextResponse.json({ error: "주제를 입력해주세요." }, { status: 400 });
    }

    const initialState: DebateSessionState = {
      sessionId: "",
      meta: { topic: topic.trim(), grade, subject },
      approvals: {},
    };

    const session = await prisma.debateSession.create({
      data: {
        topic: topic.trim(),
        grade,
        subject,
        stage: "A1_READY",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        state: JSON.parse(JSON.stringify(initialState)) as any,
      },
    });

    const finalState: DebateSessionState = { ...initialState, sessionId: session.id };
    await prisma.debateSession.update({
      where: { id: session.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { state: JSON.parse(JSON.stringify(finalState)) as any },
    });

    return NextResponse.json({ id: session.id });
  } catch (err) {
    console.error("Session create error:", err);
    return NextResponse.json({ error: "세션 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
