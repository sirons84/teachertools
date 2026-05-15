import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (t.length < 1 || t.length > 80) {
      return NextResponse.json({ error: "제목은 1~80자여야 합니다." }, { status: 400 });
    }
    data.title = t;
  }
  if (typeof body.description === "string" || body.description === null) {
    data.description = body.description ? String(body.description).trim().slice(0, 300) : null;
  }
  if (typeof body.bgColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(body.bgColor)) {
    data.bgColor = body.bgColor;
  }
  if (typeof body.isArchived === "boolean") {
    data.isArchived = body.isArchived;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "수정할 항목이 없습니다." }, { status: 400 });
  }
  try {
    const board = await prisma.padletBoard.update({ where: { id }, data });
    return NextResponse.json({ board });
  } catch {
    return NextResponse.json({ error: "보드를 찾을 수 없습니다." }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    await prisma.padletBoard.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "보드를 찾을 수 없습니다." }, { status: 404 });
  }
}
