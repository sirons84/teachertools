import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getItem } from "@/lib/hoeung/items";

type Ctx = { params: Promise<{ studentId: string }> };

/**
 * { currentItemId } — 15초마다 + 문항을 옮길 때.
 * lastActiveAt 은 매번, currentItemSince 는 문항이 바뀔 때만 갱신한다.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { studentId } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const currentItemId =
    typeof body.currentItemId === "string" && getItem(body.currentItemId)
      ? body.currentItemId
      : null;

  const now = new Date();
  // 문항이 그대로면 시각만 갱신
  const same = await prisma.hoeungStudent.updateMany({
    where: { id: studentId, currentItemId },
    data: { lastActiveAt: now },
  });
  if (same.count === 0) {
    const moved = await prisma.hoeungStudent.updateMany({
      where: { id: studentId },
      data: { lastActiveAt: now, currentItemId, currentItemSince: now },
    });
    if (moved.count === 0) {
      return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
    }
  }
  return NextResponse.json({ ok: true });
}
