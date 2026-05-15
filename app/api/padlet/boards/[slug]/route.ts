import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionIdReadOnly } from "@/lib/padlet/session";
import { normalizeSlug } from "@/lib/padlet/slug";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const mySessionId = await getSessionIdReadOnly();
  const board = await prisma.padletBoard.findUnique({
    where: { slug: normalizeSlug(slug) },
    include: {
      posts: {
        orderBy: { createdAt: "asc" },
        include: {
          attachments: true,
          reactions: { select: { emoji: true, sessionId: true } },
          _count: { select: { comments: true } },
        },
      },
    },
  });
  if (!board) {
    return NextResponse.json({ error: "보드를 찾을 수 없습니다." }, { status: 404 });
  }
  if (board.isArchived) {
    return NextResponse.json({ error: "아카이브된 보드입니다." }, { status: 410 });
  }

  return NextResponse.json({
    board: {
      id: board.id,
      slug: board.slug,
      title: board.title,
      description: board.description,
      bgColor: board.bgColor,
    },
    mySessionId,
    posts: board.posts.map((p) => {
      const tally: Record<string, { count: number; sessions: string[] }> = {};
      for (const r of p.reactions) {
        if (!tally[r.emoji]) tally[r.emoji] = { count: 0, sessions: [] };
        tally[r.emoji].count += 1;
        tally[r.emoji].sessions.push(r.sessionId);
      }
      return {
        id: p.id,
        nickname: p.nickname,
        sessionId: p.sessionId,
        contentText: p.contentText,
        posX: p.posX,
        posY: p.posY,
        width: p.width,
        height: p.height,
        color: p.color,
        zIndex: p.zIndex,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        attachments: p.attachments.map((a) => ({
          id: a.id,
          type: a.type,
          url: a.url,
          filename: a.filename,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
          embedMeta: a.embedMeta,
        })),
        reactions: tally,
        commentCount: p._count.comments,
      };
    }),
  });
}
