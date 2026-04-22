import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const maxDuration = 30;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.debateSession.update({
      where: { id },
      data: { stage: "A3_DONE" },
    });
    return NextResponse.json({ stage: "A3_DONE" });
  } catch (err) {
    console.error("Finish debate error:", err);
    return NextResponse.json({ error: "토론 종료 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
