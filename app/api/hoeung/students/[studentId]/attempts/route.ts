import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getItem, type AttemptStatus, type Part } from "@/lib/hoeung/items";

type Ctx = { params: Promise<{ studentId: string }> };

const MAX_ANSWER_LEN = 300;

const STATUS_BY_PART: Record<Part, AttemptStatus[]> = {
  1: ["correct", "wrong", "revealed"],
  2: ["correct", "wrong", "revealed"],
  3: ["ok", "needs-check"],
  4: ["submitted"],
};

/**
 * 풀이 기록 upsert { itemId, part, answer, status, tries? }.
 * 판정은 클라이언트가 하고 서버는 저장만 한다. studentId(cuid)가 토큰 역할.
 * tries 는 클라이언트 값을 그대로 쓴다 — 끊겼다 다시 보내도 두 번 세지 않도록.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { studentId } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const item = getItem(typeof body.itemId === "string" ? body.itemId : null);
  if (!item || body.part !== item.part) {
    return NextResponse.json({ error: "없는 문항입니다." }, { status: 400 });
  }
  const status = body.status as AttemptStatus;
  if (!STATUS_BY_PART[item.part].includes(status)) {
    return NextResponse.json({ error: "잘못된 상태입니다." }, { status: 400 });
  }
  if (typeof body.answer !== "string") {
    return NextResponse.json({ error: "답이 없습니다." }, { status: 400 });
  }
  const answer = body.answer.slice(0, MAX_ANSWER_LEN);
  const tries =
    typeof body.tries === "number" && Number.isInteger(body.tries) && body.tries >= 1
      ? Math.min(body.tries, 99)
      : null;

  // 방이 삭제된 뒤에도 패드는 계속 보낼 수 있다 — 예외 없이 404 로 답한다 (클라이언트가 큐에서 버림)
  const alive = await prisma.hoeungStudent.updateMany({
    where: { id: studentId },
    data: { lastActiveAt: new Date() },
  });
  if (alive.count === 0) {
    return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.hoeungAttempt.upsert({
    where: { studentId_itemId: { studentId, itemId: item.id } },
    create: { studentId, itemId: item.id, part: item.part, answer, status, tries: tries ?? 1 },
    update: { answer, status, tries: tries ?? { increment: 1 } },
    select: { id: true },
  });
  return NextResponse.json({ ok: true });
}
