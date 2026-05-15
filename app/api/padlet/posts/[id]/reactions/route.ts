import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSessionId } from "@/lib/padlet/session";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED_EMOJIS = new Set(["👍", "❤️", "😂", "🎉", "😮", "👏"]);

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  let body: { emoji?: unknown };
  try {
    body = (await req.json()) as { emoji?: unknown };
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const emoji = typeof body.emoji === "string" ? body.emoji : "";
  if (!ALLOWED_EMOJIS.has(emoji)) {
    return NextResponse.json({ error: "지원하지 않는 이모지입니다." }, { status: 400 });
  }
  const post = await prisma.padletPost.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "글이 없습니다." }, { status: 404 });

  const sessionId = await getOrCreateSessionId();
  const existing = await prisma.padletReaction.findUnique({
    where: { postId_sessionId_emoji: { postId: id, sessionId, emoji } },
  });
  if (existing) {
    await prisma.padletReaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ toggled: "off" });
  }
  await prisma.padletReaction.create({ data: { postId: id, sessionId, emoji } });
  return NextResponse.json({ toggled: "on" });
}
