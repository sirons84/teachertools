import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const LOGIN_REQUIRED_AGENTS = new Set(["feedback"]);

function canAccess(
  conv: { browserId: string; userId: string | null; agentId: string },
  browserId: string,
  userId: string | null
): boolean {
  if (LOGIN_REQUIRED_AGENTS.has(conv.agentId)) {
    return !!userId && conv.userId === userId;
  }
  return conv.browserId === browserId;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const browserId = req.nextUrl.searchParams.get("browserId");
  if (!browserId) {
    return NextResponse.json(
      { success: false, error: "browserId가 필요합니다." },
      { status: 400 }
    );
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const conv = await prisma.classmateConversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conv || !canAccess(conv, browserId, userId)) {
    return NextResponse.json(
      { success: false, error: "대화를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    conversation: {
      id: conv.id,
      agentId: conv.agentId,
      title: conv.title,
      updatedAt: conv.updatedAt.getTime(),
      messages: conv.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        createdAt: m.createdAt.getTime(),
      })),
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const browserId = req.nextUrl.searchParams.get("browserId");
  if (!browserId) {
    return NextResponse.json(
      { success: false, error: "browserId가 필요합니다." },
      { status: 400 }
    );
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const conv = await prisma.classmateConversation.findUnique({
    where: { id },
    select: { browserId: true, userId: true, agentId: true },
  });

  if (!conv || !canAccess(conv, browserId, userId)) {
    return NextResponse.json(
      { success: false, error: "대화를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  await prisma.classmateConversation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
