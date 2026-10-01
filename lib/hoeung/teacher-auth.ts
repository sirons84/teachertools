/**
 * 문장 호응 체크 — 교사 확인.
 * 로그인 없이 방마다 teacherKey 하나로 구분한다. `?k=` 로 한 번 들어오면
 * 쿠키에 넣어 두고 이후에는 `?k` 없이 접근한다.
 */

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { isValidRoomCode, normalizeRoomCode } from "./code";

const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30일

export function teacherCookieName(code: string): string {
  return `hoeung_k_${code}`;
}

function sameKey(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** 라우트 핸들러 전용 (서버 컴포넌트 렌더 중에는 쿠키를 쓸 수 없다) */
export async function rememberTeacherKey(code: string, teacherKey: string) {
  const store = await cookies();
  store.set(teacherCookieName(code), teacherKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function forgetTeacherKey(code: string) {
  const store = await cookies();
  store.delete(teacherCookieName(code));
}

export type TeacherRoomResult =
  | {
      status: "ok";
      room: { id: string; code: string; title: string; teacherKey: string; createdAt: Date };
      /** `?k=` 로 인증됐는지 (쿠키에 새로 넣어야 하는 경우) */
      viaQuery: boolean;
    }
  | { status: "not-found" }
  | { status: "unauthorized" };

/** 방을 찾고 `?k` 또는 쿠키의 teacherKey 를 확인한다 */
export async function getTeacherRoom(
  rawCode: string,
  queryKey: string | null | undefined
): Promise<TeacherRoomResult> {
  const code = normalizeRoomCode(rawCode);
  if (!isValidRoomCode(code)) return { status: "not-found" };

  const room = await prisma.hoeungRoom.findUnique({
    where: { code },
    select: { id: true, code: true, title: true, teacherKey: true, createdAt: true },
  });
  if (!room) return { status: "not-found" };

  if (queryKey && sameKey(queryKey, room.teacherKey)) {
    return { status: "ok", room, viaQuery: true };
  }
  const cookieKey = (await cookies()).get(teacherCookieName(code))?.value;
  if (cookieKey && sameKey(cookieKey, room.teacherKey)) {
    return { status: "ok", room, viaQuery: false };
  }
  return { status: "unauthorized" };
}
