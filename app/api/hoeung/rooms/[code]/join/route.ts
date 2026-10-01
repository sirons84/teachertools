import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  isValidNumber,
  isValidRoomCode,
  normalizeName,
  normalizeRoomCode,
} from "@/lib/hoeung/code";

type Ctx = { params: Promise<{ code: string }> };

/**
 * 입장: { number, name } → 학생 생성 또는 복원.
 * 같은 방·번호면 어느 기기든 같은 학생으로 보고(경고 없이 이어서 풀기) 이름만 최신으로 갱신한다.
 * 이름은 교사 대시보드 식별용 — 응답으로 돌려주지 않는다.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { code: rawCode } = await params;
  const code = normalizeRoomCode(rawCode);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const number = body.number;
  const name = normalizeName(body.name);
  if (!isValidNumber(number)) {
    return NextResponse.json({ error: "번호는 1~40 사이로 입력해 주세요." }, { status: 400 });
  }
  if (!isValidRoomCode(code)) {
    return NextResponse.json({ error: "방 코드를 다시 확인해 주세요." }, { status: 404 });
  }

  const room = await prisma.hoeungRoom.findUnique({
    where: { code },
    select: { id: true, isClosed: true },
  });
  if (!room) {
    return NextResponse.json({ error: "방 코드를 다시 확인해 주세요." }, { status: 404 });
  }
  if (room.isClosed) {
    return NextResponse.json({ error: "닫힌 방입니다." }, { status: 410 });
  }

  const student = await prisma.hoeungStudent.upsert({
    where: { roomId_number: { roomId: room.id, number } },
    create: { roomId: room.id, number, name },
    update: { lastActiveAt: new Date(), ...(name ? { name } : {}) },
    select: {
      id: true,
      currentItemId: true,
      attempts: {
        select: {
          itemId: true,
          part: true,
          answer: true,
          status: true,
          tries: true,
          checked: true,
          updatedAt: true,
        },
      },
    },
  });

  return NextResponse.json({
    studentId: student.id,
    currentItemId: student.currentItemId,
    attempts: student.attempts.map((a) => ({
      ...a,
      updatedAt: a.updatedAt.getTime(),
    })),
  });
}
