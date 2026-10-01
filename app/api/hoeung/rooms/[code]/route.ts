import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forgetTeacherKey, getTeacherRoom } from "@/lib/hoeung/teacher-auth";

type Ctx = { params: Promise<{ code: string }> };

/** 방과 모든 풀이 기록 삭제 (학생·기록은 onDelete: Cascade) */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { code } = await params;
  const auth = await getTeacherRoom(code, req.nextUrl.searchParams.get("k"));
  if (auth.status === "not-found") {
    return NextResponse.json({ error: "방을 찾을 수 없습니다." }, { status: 404 });
  }
  if (auth.status === "unauthorized") {
    return NextResponse.json({ error: "교사 확인이 필요합니다." }, { status: 401 });
  }

  await prisma.hoeungRoom.delete({ where: { id: auth.room.id } });
  await forgetTeacherKey(auth.room.code);
  return NextResponse.json({ ok: true });
}
