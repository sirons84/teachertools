import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const LOGIN_REQUIRED_AGENTS = ["feedback"];

export async function GET(req: NextRequest) {
  const browserId = req.nextUrl.searchParams.get("browserId");
  if (!browserId) {
    return NextResponse.json(
      { success: false, error: "browserId가 필요합니다." },
      { status: 400 }
    );
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const where = userId
    ? {
        OR: [
          { browserId, agentId: { notIn: LOGIN_REQUIRED_AGENTS } },
          { userId, agentId: { in: LOGIN_REQUIRED_AGENTS } },
        ],
      }
    : { browserId, agentId: { notIn: LOGIN_REQUIRED_AGENTS } };

  const rows = await prisma.classmateConversation.findMany({
    where,
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
