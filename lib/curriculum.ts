import { readFile } from "fs/promises";
import path from "path";

interface UnitEntry {
  대단원: string;
}

type TextbookData = Record<
  string,
  Record<string, Record<string, Record<string, UnitEntry[]>>>
>;

interface AchievementEntry {
  코드: string;
  성취기준: string;
}

type AchievementsData = Record<string, Record<string, Record<string, AchievementEntry[]>>>;

let textbookCache: TextbookData | null = null;
let achievementsCache: AchievementsData | null = null;

async function loadTextbook(): Promise<TextbookData> {
  if (textbookCache) return textbookCache;
  const raw = await readFile(
    path.join(process.cwd(), "data/마이클_초등22개정_대단원.json"),
    "utf-8",
  );
  textbookCache = JSON.parse(raw) as TextbookData;
  return textbookCache;
}

async function loadAchievements(): Promise<AchievementsData> {
  if (achievementsCache) return achievementsCache;
  const raw = await readFile(
    path.join(process.cwd(), "data/2022개정_성취기준_학년군별.json"),
    "utf-8",
  );
  achievementsCache = JSON.parse(raw) as AchievementsData;
  return achievementsCache;
}

export function normalizeGrade(input: string | undefined): string | null {
  if (!input) return null;
  const m = input.match(/([1-6])/);
  if (!m) return null;
  return `${m[1]}학년`;
}

export function normalizeSemester(input: string | undefined): string | null {
  if (!input) return null;
  if (input.includes("1") || input.includes("일")) return "1학기";
  if (input.includes("2") || input.includes("이")) return "2학기";
  return null;
}

export function gradeToBand(grade: string | undefined): string | null {
  const g = normalizeGrade(grade);
  if (!g) return null;
  const num = parseInt(g, 10);
  if (num === 1 || num === 2) return "1~2학년군";
  if (num === 3 || num === 4) return "3~4학년군";
  if (num === 5 || num === 6) return "5~6학년군";
  return null;
}

export type TextbookLookup =
  | { kind: "국정"; units: string[] }
  | { kind: "검정"; publishers: string[]; units?: string[]; publisher?: string }
  | { kind: "unknown"; reason: string };

export async function lookupTextbook(
  grade: string,
  semester: string,
  subject: string,
  publisher?: string,
): Promise<TextbookLookup> {
  const data = await loadTextbook();
  const g = normalizeGrade(grade);
  const s = normalizeSemester(semester);
  if (!g || !s) {
    return { kind: "unknown", reason: "학년 또는 학기 형식을 인식할 수 없습니다." };
  }
  const yearNode = data[g];
  if (!yearNode) return { kind: "unknown", reason: `${g} 데이터가 없습니다.` };
  const semNode = yearNode[s];
  if (!semNode) return { kind: "unknown", reason: `${g} ${s} 데이터가 없습니다.` };
  const subjNode = semNode[subject];
  if (!subjNode) {
    const available = Object.keys(semNode).join(", ");
    return {
      kind: "unknown",
      reason: `${g} ${s}에 "${subject}" 교과가 없습니다. 가능한 교과: ${available}`,
    };
  }

  const publishers = Object.keys(subjNode);
  if (publishers.length === 1 && publishers[0] === "국정") {
    return { kind: "국정", units: subjNode["국정"].map((u) => u.대단원) };
  }

  if (!publisher) {
    return { kind: "검정", publishers };
  }

  const matched =
    subjNode[publisher] ?? subjNode[publishers.find((p) => p.includes(publisher)) ?? ""];
  if (!matched) {
    return {
      kind: "검정",
      publishers,
      reason: `"${publisher}" 출판사를 찾을 수 없습니다.`,
    } as TextbookLookup;
  }

  return {
    kind: "검정",
    publishers,
    publisher: Object.keys(subjNode).find((k) => subjNode[k] === matched) ?? publisher,
    units: matched.map((u) => u.대단원),
  };
}

export interface AchievementItem {
  code: string;
  text: string;
  domain: string;
}

export async function lookupAchievements(
  grade: string,
  subject: string,
  domain?: string,
): Promise<AchievementItem[]> {
  const data = await loadAchievements();
  const band = gradeToBand(grade);
  if (!band) return [];
  const bandNode = data[band];
  if (!bandNode) return [];
  const subjNode = bandNode[subject];
  if (!subjNode) return [];

  const result: AchievementItem[] = [];
  for (const [d, items] of Object.entries(subjNode)) {
    if (domain && d !== domain) continue;
    for (const it of items) {
      result.push({ code: it.코드, text: it.성취기준, domain: d });
    }
  }
  return result;
}

export async function getAchievementDomains(grade: string, subject: string): Promise<string[]> {
  const data = await loadAchievements();
  const band = gradeToBand(grade);
  if (!band) return [];
  const subjNode = data[band]?.[subject];
  if (!subjNode) return [];
  return Object.keys(subjNode);
}
