/**
 * 문장 호응 체크 — 문항 로드 + 타입.
 * 문항은 data/hoeung-items.json 에만 둔다 (교사가 직접 수정, DB 에 넣지 않음).
 */

import raw from "@/data/hoeung-items.json";

export type Part = 1 | 2 | 3 | 4;

/** part1/2: correct|wrong|revealed, part3: ok|needs-check, part4: submitted */
export type AttemptStatus =
  | "correct"
  | "wrong"
  | "revealed"
  | "ok"
  | "needs-check"
  | "submitted";

export const ATTEMPT_STATUSES: AttemptStatus[] = [
  "correct",
  "wrong",
  "revealed",
  "ok",
  "needs-check",
  "submitted",
];

export interface Part1Item {
  id: string;
  part: 1;
  chips: string[];
  answer: number;
  fixed: string;
  hint: string;
}

export interface Part2Item {
  id: string;
  part: 2;
  sentence: string;
  choices: string[];
  answer: number;
  hint: string;
}

export interface Part3Item {
  id: string;
  part: 3;
  before: string;
  after: string;
  accept: string[];
  model: string;
  hint: string;
}

export interface Part4Item {
  id: string;
  part: 4;
  words: string[];
}

export type HoeungItem = Part1Item | Part2Item | Part3Item | Part4Item;

export interface PartInfo {
  part: Part;
  title: string;
  instruction: string;
  items: HoeungItem[];
}

export const PARTS: PartInfo[] = [
  {
    part: 1,
    title: raw.part1.title,
    instruction: raw.part1.instruction,
    items: raw.part1.items.map((it) => ({ ...it, part: 1 as const })),
  },
  {
    part: 2,
    title: raw.part2.title,
    instruction: raw.part2.instruction,
    items: raw.part2.items.map((it) => ({ ...it, part: 2 as const })),
  },
  {
    part: 3,
    title: raw.part3.title,
    instruction: raw.part3.instruction,
    items: raw.part3.items.map((it) => ({ ...it, part: 3 as const })),
  },
  {
    part: 4,
    title: raw.part4.title,
    instruction: raw.part4.instruction,
    items: raw.part4.items.map((it) => ({ ...it, part: 4 as const })),
  },
];

export const ALL_ITEMS: HoeungItem[] = PARTS.flatMap((p) => p.items);
export const TOTAL_ITEMS = ALL_ITEMS.length;

const BY_ID = new Map(ALL_ITEMS.map((it) => [it.id, it]));

export function getItem(id: string | null | undefined): HoeungItem | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function getPart(part: number): PartInfo | undefined {
  return PARTS.find((p) => p.part === part);
}

/** PART 안에서의 순번 (1부터). 없으면 0 */
export function itemOrder(id: string): number {
  const item = BY_ID.get(id);
  if (!item) return 0;
  return (getPart(item.part)?.items.findIndex((it) => it.id === id) ?? -1) + 1;
}

/** "PART2-3" 같은 짧은 이름 */
export function itemLabel(id: string): string {
  const item = BY_ID.get(id);
  return item ? `PART${item.part}-${itemOrder(id)}` : id;
}

/** 문항 본문 한 줄 (교사 화면·CSV 용) */
export function itemText(item: HoeungItem): string {
  switch (item.part) {
    case 1:
      return item.chips.join(" ");
    case 2:
      return item.sentence;
    case 3:
      return `${item.before}___${item.after}`;
    case 4:
      return item.words.join(" + ");
  }
}

/** 저장된 답(인덱스 또는 텍스트)을 사람이 읽는 글로 */
export function answerText(item: HoeungItem, answer: string): string {
  if (item.part === 1) return item.chips[Number(answer)] ?? answer;
  if (item.part === 2) return item.choices[Number(answer)] ?? answer;
  return answer;
}

/** 정답(모범 답). PART4 는 채점이 없으므로 빈 문자열 */
export function correctText(item: HoeungItem): string {
  switch (item.part) {
    case 1:
      return `${item.chips[item.answer]} → ${item.fixed}`;
    case 2:
      return item.choices[item.answer];
    case 3:
      return item.model;
    case 4:
      return "";
  }
}

/**
 * "지나간" 문항인지 — 1차 오답("wrong")만 아직 진행 중이고 나머지는 모두 끝난 상태.
 * PART 잠금 해제와 진행률 계산의 기준.
 */
export function isPassed(status: string | undefined): boolean {
  return status !== undefined && status !== "wrong";
}

export const STATUS_LABEL: Record<AttemptStatus, string> = {
  correct: "맞음",
  wrong: "재도전 중",
  revealed: "정답 봄",
  ok: "통과",
  "needs-check": "확인 필요",
  submitted: "제출",
};

/** 문항 점의 상태 색 — 회색(안 품) / 초록(맞음·제출) / 주황(정답 봄) / 노랑(확인 필요) */
export type DotKind = "todo" | "good" | "revealed" | "check";

export function dotKind(status: string | undefined): DotKind {
  switch (status) {
    case "correct":
    case "ok":
    case "submitted":
      return "good";
    case "revealed":
      return "revealed";
    case "needs-check":
      return "check";
    default:
      return "todo";
  }
}

export const DOT_CLASS: Record<DotKind, string> = {
  todo: "bg-gray-200 text-gray-500",
  good: "bg-green-500 text-white",
  revealed: "bg-orange-500 text-white",
  check: "bg-yellow-400 text-gray-900",
};
