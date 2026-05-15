import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionIdReadOnly } from "@/lib/padlet/session";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const sessionId = await getSessionIdReadOnly();
  if (!sessionId) {
    return NextResponse.json({ error: "세션이 필요합니다." }, { status: 401 });
  }
  const comment = await prisma.padletComment.findUnique({ where: { id } });
  if (!comment) return NextResponse.json({ error: "댓글이 없습니다." }, { status: 404 });
  if (comment.sessionId !== sessionId) {
    return NextResponse.json({ error: "본인 댓글만 삭제할 수 있습니다." }, { status: 403 });
  }
  await prisma.padletComment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
