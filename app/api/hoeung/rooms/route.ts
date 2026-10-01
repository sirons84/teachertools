import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateRoomCode } from "@/lib/hoeung/code";
import { rememberTeacherKey } from "@/lib/hoeung/teacher-auth";

/** 방 생성 → { code, teacherKey }. 로그인 없음 (수업 직전에 교사 패드에서 바로 만든다) */
export async function POST() {
  const teacherKey = nanoid(16);

  // 코드가 겹치면 다시 뽑는다
  for (let i = 0; i < 8; i++) {
    const code = generateRoomCode();
    try {
      await prisma.hoeungRoom.create({ data: { code, teacherKey } });
      await rememberTeacherKey(code, teacherKey);
      return NextResponse.json({ code, teacherKey });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  return NextResponse.json(
    { error: "방 코드를 만들지 못했습니다. 다시 시도해 주세요." },
    { status: 503 }
  );
}
