import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionIdReadOnly } from "@/lib/padlet/session";
import { isValidPostColor } from "@/lib/padlet/colors";

type Ctx = { params: Promise<{ id: string }> };

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const sessionId = await getSessionIdReadOnly();
  if (!sessionId) {
    return NextResponse.json({ error: "세션이 필요합니다." }, { status: 401 });
  }
  const post = await prisma.padletPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "글이 없습니다." }, { status: 404 });
  if (post.sessionId !== sessionId) {
    return NextResponse.json({ error: "본인 글만 수정할 수 있습니다." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const data: Record<string, unknown> = {};
  if (typeof body.contentText === "string") {
    data.contentText = body.contentText.trim().slice(0, 1000);
  } else if (body.contentText === null) {
    data.contentText = null;
  }
  if (typeof body.posX === "number" && Number.isFinite(body.posX)) {
    data.posX = clamp(Math.floor(body.posX), 0, 2800);
  }
  if (typeof body.posY === "number" && Number.isFinite(body.posY)) {
    data.posY = clamp(Math.floor(body.posY), 0, 1800);
  }
  if (typeof body.width === "number" && Number.isFinite(body.width)) {
    data.width = clamp(Math.floor(body.width), 160, 480);
  }
  if (typeof body.height === "number" && Number.isFinite(body.height)) {
    data.height = clamp(Math.floor(body.height), 120, 600);
  }
  if (isValidPostColor(body.color)) data.color = body.color;
  if (typeof body.zIndex === "number" && Number.isFinite(body.zIndex)) {
    data.zIndex = clamp(Math.floor(body.zIndex), 0, 99999);
  }

  const updated = await prisma.padletPost.update({ where: { id }, data });
  return NextResponse.json({ post: { ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() } });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const sessionId = await getSessionIdReadOnly();
  if (!sessionId) {
    return NextResponse.json({ error: "세션이 필요합니다." }, { status: 401 });
  }
  const post = await prisma.padletPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "글이 없습니다." }, { status: 404 });
  if (post.sessionId !== sessionId) {
    return NextResponse.json({ error: "본인 글만 삭제할 수 있습니다." }, { status: 403 });
  }
  await prisma.padletPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
