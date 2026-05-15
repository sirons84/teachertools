import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSessionId, isValidNickname, setNickname } from "@/lib/padlet/session";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const comments = await prisma.padletComment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      nickname: c.nickname,
      sessionId: c.sessionId,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  let body: { nickname?: unknown; content?: unknown };
  try {
    body = (await req.json()) as { nickname?: unknown; content?: unknown };
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  if (!isValidNickname(nickname)) {
    return NextResponse.json({ error: "닉네임은 2~20자여야 합니다." }, { status: 400 });
  }
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (content.length < 1 || content.length > 500) {
    return NextResponse.json({ error: "댓글은 1~500자여야 합니다." }, { status: 400 });
  }
  const post = await prisma.padletPost.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "글이 없습니다." }, { status: 404 });

  await setNickname(nickname);
  const sessionId = await getOrCreateSessionId();
  const comment = await prisma.padletComment.create({
    data: { postId: id, sessionId, nickname, content },
  });
  return NextResponse.json({
    comment: {
      id: comment.id,
      nickname: comment.nickname,
      sessionId: comment.sessionId,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    },
  });
}
