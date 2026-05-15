import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getOrCreateSessionId, isValidNickname, setNickname } from "@/lib/padlet/session";
import { isValidPostColor, randomPostColor } from "@/lib/padlet/colors";

type Ctx = { params: Promise<{ slug: string }> };

interface AttachmentInput {
  type: "image" | "file" | "embed";
  url: string;
  filename?: string;
  fileSize?: number;
  mimeType?: string;
  embedMeta?: Record<string, unknown>;
}

function sanitizeAttachments(value: unknown): AttachmentInput[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 1) // 카드당 최대 1개
    .map((raw): AttachmentInput | null => {
      if (!raw || typeof raw !== "object") return null;
      const a = raw as Record<string, unknown>;
      const type = a.type;
      if (type !== "image" && type !== "file" && type !== "embed") return null;
      if (typeof a.url !== "string" || a.url.length === 0 || a.url.length > 2000) return null;
      return {
        type,
        url: a.url,
        filename: typeof a.filename === "string" ? a.filename.slice(0, 200) : undefined,
        fileSize:
          typeof a.fileSize === "number" && Number.isFinite(a.fileSize)
            ? Math.floor(a.fileSize)
            : undefined,
        mimeType: typeof a.mimeType === "string" ? a.mimeType.slice(0, 120) : undefined,
        embedMeta:
          a.embedMeta && typeof a.embedMeta === "object"
            ? (a.embedMeta as Record<string, unknown>)
            : undefined,
      };
    })
    .filter((x): x is AttachmentInput => x !== null);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const board = await prisma.padletBoard.findUnique({ where: { slug } });
  if (!board || board.isArchived) {
    return NextResponse.json({ error: "보드를 찾을 수 없습니다." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  if (!isValidNickname(nickname)) {
    return NextResponse.json({ error: "닉네임은 2~20자여야 합니다." }, { status: 400 });
  }
  await setNickname(nickname);

  const contentText =
    typeof body.contentText === "string" ? body.contentText.trim().slice(0, 1000) : null;
  const attachments = sanitizeAttachments(body.attachments);

  if (!contentText && attachments.length === 0) {
    return NextResponse.json({ error: "본문 또는 첨부가 필요합니다." }, { status: 400 });
  }

  const color = isValidPostColor(body.color) ? body.color : randomPostColor();
  const posX =
    typeof body.posX === "number" && Number.isFinite(body.posX)
      ? clamp(Math.floor(body.posX), 0, 2800)
      : Math.floor(800 + Math.random() * 400);
  const posY =
    typeof body.posY === "number" && Number.isFinite(body.posY)
      ? clamp(Math.floor(body.posY), 0, 1800)
      : Math.floor(400 + Math.random() * 300);

  const sessionId = await getOrCreateSessionId();

  const post = await prisma.padletPost.create({
    data: {
      boardId: board.id,
      nickname,
      sessionId,
      contentText,
      color,
      posX,
      posY,
      attachments:
        attachments.length > 0
          ? {
              create: attachments.map((a) => ({
                type: a.type,
                url: a.url,
                filename: a.filename ?? null,
                fileSize: a.fileSize ?? null,
                mimeType: a.mimeType ?? null,
                embedMeta: a.embedMeta
                  ? (a.embedMeta as Prisma.InputJsonValue)
                  : Prisma.JsonNull,
              })),
            }
          : undefined,
    },
    include: { attachments: true },
  });

  return NextResponse.json({
    post: {
      id: post.id,
      nickname: post.nickname,
      sessionId: post.sessionId,
      contentText: post.contentText,
      posX: post.posX,
      posY: post.posY,
      width: post.width,
      height: post.height,
      color: post.color,
      zIndex: post.zIndex,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      attachments: post.attachments.map((a) => ({
        id: a.id,
        type: a.type,
        url: a.url,
        filename: a.filename,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
        embedMeta: a.embedMeta,
      })),
      reactions: {},
      commentCount: 0,
    },
  });
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
