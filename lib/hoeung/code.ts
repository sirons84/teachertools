/**
 * 문장 호응 체크 — 방 코드.
 * 학생이 패드로 직접 치므로 헷갈리는 글자(0/O/1/I)는 쓰지 않는다.
 */

export const CODE_LENGTH = 4;
export const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateRoomCode(): string {
  const bytes = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const b of bytes) code += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return code;
}

/** 입력값 정리: 공백 제거 + 대문자 */
export function normalizeRoomCode(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function isValidRoomCode(value: string): boolean {
  if (value.length !== CODE_LENGTH) return false;
  for (const ch of value) if (!CODE_ALPHABET.includes(ch)) return false;
  return true;
}

export const MAX_NAME_LENGTH = 10;

/** 이름 정리: 제어 문자 제거, 공백 정리, 길이 제한 */
export function normalizeName(value: unknown): string {
  if (typeof value !== "string") return "";
  let cleaned = "";
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    cleaned += code < 0x20 || code === 0x7f ? " " : ch;
  }
  return cleaned.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
}

export const MIN_NUMBER = 1;
export const MAX_NUMBER = 40;

export function isValidNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_NUMBER &&
    value <= MAX_NUMBER
  );
}
