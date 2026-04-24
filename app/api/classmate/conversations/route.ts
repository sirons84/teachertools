import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const browserId = req.nextUrl.searchParams.get("browserId");
  if (!browserId) {
    return NextResponse.json(
      { success: false, error: "browserId가 필요합니다." },
      { status: 400 }
    );
  }

  const rows = await prisma.classmateConversation.findMany({
    where: { browserId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      agentId: true,
      title: true,
      updatedAt: true,
    },
    take: 100,
  });

  return NextResponse.json({
    success: true,
    conversations: rows.map((r) => ({
      id: r.id,
      agentId: r.agentId,
      title: r.title,
      updatedAt: r.updatedAt.getTime(),
    })),
  });
}
