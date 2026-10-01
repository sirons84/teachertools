import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ studentId: string; itemId: string }> };

/** 「선생님과 확인했어요」 → { checked: true } */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { studentId, itemId } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (typeof body.checked !== "boolean") {
    return NextResponse.json({ error: "checked 값이 필요합니다." }, { status: 400 });
  }

  const result = await prisma.hoeungAttempt.updateMany({
    where: { studentId, itemId },
    data: { checked: body.checked },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
