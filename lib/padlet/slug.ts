import { customAlphabet } from "nanoid";

const SUFFIX_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const makeSuffix = customAlphabet(SUFFIX_ALPHABET, 4);

// 영문/숫자/한글 일부 보존, 그 외는 하이픈
function basicSlugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 40);
}

export function generateSlug(title: string): string {
  const base = basicSlugify(title) || "board";
  return `${base}-${makeSuffix()}`;
}

export function isValidSlug(v: unknown): v is string {
  return typeof v === "string" && /^[a-z0-9가-힣][a-z0-9가-힣-]{1,60}$/.test(v);
}
