/**
 * 음성 누가기록 — 순수 로직 (저장소 키, 번호 파싱, 명단 파싱, CSV)
 *
 * 개인정보 제약: 학생 이름은 코드에 절대 하드코딩하지 않는다.
 * 명단은 교사가 앱에서 등록해 브라우저 localStorage 에만 저장된다.
 */

export interface RosterEntry {
  no: number;
  name: string;
}

export interface NugaRecord {
  id: string;
  no: number;
  /** 로컬 기준 YYYY-MM-DD */
  date: string;
  createdAt: number;
  /** 저장된 최종 문장 */
  text: string;
  /** 인식 원문 */
  raw: string;
  /** 교사가 손댔는지 */
  edited: boolean;
}

export const ROSTER_KEY = "nuga.roster.v1";
export const RECORDS_KEY = "nuga.records.v1";

/** 실수로 계속 녹음되는 것 방지 */
export const MAX_RECORD_SEC = 15;

/* ------------------------------------------------------------------ */
/* 날짜 — 반드시 로컬 기준 (밤 9시에 기록해도 그날 날짜여야 함)          */
/* ------------------------------------------------------------------ */

export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "2026-08-29" → "8월 29일 (토)" */
export function formatDateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  const dt = new Date(y, m - 1, d);
  const dow = ["일", "월", "화", "수", "목", "금", "토"][dt.getDay()];
  return `${m}월 ${d}일 (${dow})`;
}

/** 이번 주 월요일 (로컬) */
export function startOfWeek(): string {
  const d = new Date();
  const dow = (d.getDay() + 6) % 7; // 월=0
  d.setDate(d.getDate() - dow);
  return localDate(d);
}

/** 이번 달 1일 (로컬) */
export function startOfMonth(): string {
  const d = new Date();
  d.setDate(1);
  return localDate(d);
}

/* ------------------------------------------------------------------ */
/* 명단 파싱 — "번호 공백 이름" 한 줄씩                                 */
/* ------------------------------------------------------------------ */

export function parseRosterText(input: string): {
  roster: RosterEntry[];
  errors: string[];
} {
  const errors: string[] = [];
  const map = new Map<number, string>();
  let auto = 0;

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const m = line.match(/^(\d{1,3})\s*[.)\-,\t ]\s*(.+)$/);
    let no: number;
    let name: string;

    if (m) {
      no = Number(m[1]);
      name = m[2].trim();
    } else if (/^\d{1,3}$/.test(line)) {
      errors.push(`이름이 없는 줄: "${line}"`);
      continue;
    } else {
      // 번호 없이 이름만 나열한 경우 → 순서대로 번호 부여
      no = auto + 1;
      while (map.has(no)) no += 1;
      name = line;
    }

    if (!Number.isInteger(no) || no < 1 || no > 100) {
      errors.push(`번호 범위를 벗어남: "${line}"`);
      continue;
    }
    if (!name) {
      errors.push(`이름이 비어 있음: "${line}"`);
      continue;
    }
    if (map.has(no)) {
      errors.push(`번호 중복: ${no}번 (${map.get(no)} → ${name})`);
    }
    map.set(no, name);
    auto = Math.max(auto, no);
  }

  const roster = [...map.entries()]
    .map(([no, name]) => ({ no, name }))
    .sort((a, b) => a.no - b.no);

  return { roster, errors };
}

export function rosterToText(roster: RosterEntry[]): string {
  return roster.map((r) => `${r.no} ${r.name}`).join("\n");
}

/* ------------------------------------------------------------------ */
/* 번호 파싱 — 숫자 / 한자어 수사 / 고유어 수사                          */
/* ------------------------------------------------------------------ */

const SINO_DIGIT: Record<string, number> = {
  일: 1,
  이: 2,
  삼: 3,
  사: 4,
  오: 5,
  육: 6,
  륙: 6,
  칠: 7,
  팔: 8,
  구: 9,
};

const NATIVE: Record<string, number> = {
  한: 1,
  하나: 1,
  두: 2,
  둘: 2,
  세: 3,
  셋: 3,
  서: 3,
  석: 3,
  네: 4,
  넷: 4,
  너: 4,
  넉: 4,
  다섯: 5,
  여섯: 6,
  일곱: 7,
  여덟: 8,
  아홉: 9,
  열: 10,
  열한: 11,
  열하나: 11,
  열두: 12,
  열둘: 12,
  열세: 13,
  열셋: 13,
  열네: 14,
  열넷: 14,
  열다섯: 15,
  열여섯: 16,
  열일곱: 17,
  열여덟: 18,
  열아홉: 19,
  스무: 20,
  스물: 20,
  스물한: 21,
  스물하나: 21,
  스물두: 22,
  스물둘: 22,
  스물세: 23,
  스물셋: 23,
  스물네: 24,
  스물넷: 24,
};

/**
 * "이번 / 저번 / 지난번 / 매번 …" 처럼 번호가 아닌 관용어.
 * 붙여 쓴 경우(공백 없음)에는 번호로 보지 않는다.
 * 엉뚱한 학생에게 기록되는 것보다 번호를 비우는 편이 안전하다.
 */
const AMBIGUOUS = new Set(["이", "저", "지난", "요", "매", "몇", "여러", "그", "다음"]);

function sinoToNum(w: string): number | null {
  if (!w) return null;
  if (w.length === 1 && SINO_DIGIT[w] != null) return SINO_DIGIT[w];
  if (w === "십") return 10;
  const m = w.match(/^([일이삼사오육륙칠팔구])?십([일이삼사오육륙칠팔구])?$/);
  if (m) {
    const tens = m[1] ? SINO_DIGIT[m[1]] : 1;
    const ones = m[2] ? SINO_DIGIT[m[2]] : 0;
    return tens * 10 + ones;
  }
  return null;
}

function wordToNum(w: string): number | null {
  if (NATIVE[w] != null) return NATIVE[w];
  return sinoToNum(w);
}

/** 번호 부분을 떼어낸 나머지를 정돈 */
function stripNumberPart(raw: string, start: number, length: number): string {
  const rest = (raw.slice(0, start) + raw.slice(start + length))
    .replace(/^[\s,.·:;!?~-]+/, "")
    .replace(/^(?:학생|어린이)(?:은|는|이|가)?\s+/, "")
    .replace(/^(?:은|는|이|가|을|를|께서)\s+/, "")
    .replace(/^[\s,.·:;!?~-]+/, "")
    .trim();
  return rest || raw.trim();
}

export interface ParsedUtterance {
  /** 1~maxNo 범위로 확정된 번호. 실패하면 null (추측하지 않는다) */
  no: number | null;
  /** 번호를 뗀 관찰 문장 */
  text: string;
  /** 어떤 규칙으로 잡았는지 */
  matchedBy: "digit" | "sino" | "native" | null;
}

const SEARCH_WINDOW = 20;

export function parseStudentNo(input: string, maxNo = 24): ParsedUtterance {
  const raw = (input ?? "").trim();
  if (!raw) return { no: null, text: "", matchedBy: null };

  const win = raw.slice(0, SEARCH_WINDOW);

  // 1) 숫자 표기 — "7번", "24 번"
  const digit = win.match(/(\d{1,2})\s*번/);
  if (digit && digit.index != null) {
    const no = Number(digit[1]);
    if (no >= 1 && no <= maxNo) {
      return {
        no,
        text: stripNumberPart(raw, digit.index, digit[0].length),
        matchedBy: "digit",
      };
    }
  }

  // 2~3) 한글 수사 — "칠 번", "십일번", "스물네 번"
  const re = /([가-힣]{1,4})(\s*)번/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(win)) !== null) {
    const token = m[1];
    const spaced = m[2].length > 0;
    for (let len = Math.min(4, token.length); len >= 1; len -= 1) {
      const cand = token.slice(token.length - len);
      if (!spaced && AMBIGUOUS.has(cand)) continue;
      const n = wordToNum(cand);
      if (n != null && n >= 1 && n <= maxNo) {
        const offset = token.length - len;
        const start = m.index + offset;
        const length = m[0].length - offset;
        return {
          no: n,
          text: stripNumberPart(raw, start, length),
          matchedBy: NATIVE[cand] != null ? "native" : "sino",
        };
      }
    }
  }

  // 4) 실패 — 번호를 비운 채로 확인 카드를 연다 (추측 금지)
  return { no: null, text: raw, matchedBy: null };
}

/* ------------------------------------------------------------------ */
/* 집계 / 내보내기                                                      */
/* ------------------------------------------------------------------ */

export function countByStudent(records: NugaRecord[], from?: string): Map<number, number> {
  const out = new Map<number, number>();
  for (const r of records) {
    if (from && r.date < from) continue;
    out.set(r.no, (out.get(r.no) ?? 0) + 1);
  }
  return out;
}

export type Period = "week" | "month" | "all";

export function filterByPeriod(records: NugaRecord[], period: Period): NugaRecord[] {
  if (period === "all") return records;
  const from = period === "week" ? startOfWeek() : startOfMonth();
  return records.filter((r) => r.date >= from);
}

function csvCell(v: string | number): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** 번호,이름,날짜,내용 — Excel 한글 대응 BOM 포함 */
export function toCsv(records: NugaRecord[], roster: RosterEntry[]): string {
  const nameOf = new Map(roster.map((r) => [r.no, r.name]));
  const rows = [...records].sort((a, b) => a.no - b.no || a.createdAt - b.createdAt);
  const lines = ["번호,이름,날짜,내용"];
  for (const r of rows) {
    lines.push([r.no, nameOf.get(r.no) ?? "", r.date, r.text].map(csvCell).join(","));
  }
  return "﻿" + lines.join("\r\n");
}

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
