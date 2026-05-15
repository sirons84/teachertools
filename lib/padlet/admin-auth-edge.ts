// Edge/Node 양쪽에서 동작하는 어드민 토큰 검증 (middleware 용)
// node:crypto를 import하지 않고 Web Crypto API만 사용

const MAX_AGE_SEC = 60 * 60 * 24 * 7;

function getSecret(): string {
  const s = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("AUTH_SECRET 또는 ADMIN_PASSWORD가 필요합니다.");
  return s;
}

function toHex(buf: ArrayBuffer): string {
  const arr = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < arr.length; i++) {
    out += arr[i].toString(16).padStart(2, "0");
  }
  return out;
}

async function hmacHex(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return toHex(sig);
}

export async function verifyAdminTokenAsync(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [issuedStr, sig] = token.split(".");
  if (!issuedStr || !sig) return false;
  const issued = Number(issuedStr);
  if (!Number.isFinite(issued)) return false;
  const ageSec = (Date.now() - issued) / 1000;
  if (ageSec < 0 || ageSec > MAX_AGE_SEC) return false;
  try {
    const expected = await hmacHex(issuedStr, getSecret());
    if (expected.length !== sig.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

export const ADMIN_COOKIE_NAME = "padlet_admin";
