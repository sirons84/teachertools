import { cookies } from "next/headers";
import { nanoid } from "nanoid";

const SID_COOKIE = "pad_sid";
const NICK_COOKIE = "pad_nick";
const MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1년

export async function getOrCreateSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(SID_COOKIE)?.value;
  if (existing && existing.length >= 8) return existing;
  const sid = nanoid(24);
  store.set(SID_COOKIE, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
  return sid;
}

export async function getSessionIdReadOnly(): Promise<string | null> {
  const store = await cookies();
  return store.get(SID_COOKIE)?.value ?? null;
}

export async function getNickname(): Promise<string | null> {
  const store = await cookies();
  const nick = store.get(NICK_COOKIE)?.value;
  return nick && nick.trim().length > 0 ? nick : null;
}

export async function setNickname(nickname: string) {
  const trimmed = nickname.trim();
  if (trimmed.length < 2 || trimmed.length > 20) {
    throw new Error("닉네임은 2~20자여야 합니다.");
  }
  const store = await cookies();
  store.set(NICK_COOKIE, trimmed, {
    httpOnly: false, // 클라이언트에서 읽을 수 있어야 함
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export function isValidNickname(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const t = value.trim();
  return t.length >= 2 && t.length <= 20;
}

export const SESSION_COOKIE_NAMES = {
  sid: SID_COOKIE,
  nick: NICK_COOKIE,
};
