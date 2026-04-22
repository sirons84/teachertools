import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const maxDuration = 30;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await prisma.debateSession.findUnique({
      where: { id },
      include: { turns: { orderBy: { order: "asc" } } },
    });
    if (!session) return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json(session);
  } catch (err) {
    console.error("Session get error:", err);
    return NextResponse.json({ error: "세션 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
