import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "padlet_admin";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7일

function secret(): string {
  const s = process.env.AUTH_SECRET || process.env.PADLET_ADMIN_PASSWORD;
  if (!s) {
    throw new Error("AUTH_SECRET 또는 PADLET_ADMIN_PASSWORD 환경변수가 필요합니다.");
  }
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

function makeToken(): string {
  const issued = Date.now().toString();
  const sig = sign(issued);
  return `${issued}.${sig}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [issuedStr, sig] = token.split(".");
  if (!issuedStr || !sig) return false;
  const expected = sign(issuedStr);
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
    return false;
  }
  const issued = Number(issuedStr);
  if (!Number.isFinite(issued)) return false;
  const ageSec = (Date.now() - issued) / 1000;
  return ageSec >= 0 && ageSec <= MAX_AGE_SEC;
}

export function checkPassword(input: string): boolean {
  const expected = process.env.PADLET_ADMIN_PASSWORD;
  if (!expected) return false;
  if (input.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}

export async function setAdminCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

// middleware에서 cookie 객체를 직접 받아 검증
export function isAdminFromCookie(value: string | undefined): boolean {
  return verifyToken(value);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
