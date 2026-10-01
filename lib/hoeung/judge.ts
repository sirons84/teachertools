/**
 * 문장 호응 체크 — PART별 판정 (순수 함수).
 * 판정은 클라이언트에서 하고 결과 status 만 서버로 보낸다 (네트워크가 끊겨도 학생 화면은 동작).
 */

import type { AttemptStatus, Part1Item, Part2Item, Part3Item } from "./items";

/** PART1: 탭한 어절 인덱스가 정답인지 */
export function judgePart1(item: Pick<Part1Item, "answer">, index: number): boolean {
  return index === item.answer;
}

/** PART2: 고른 보기 인덱스가 정답인지 */
export function judgePart2(item: Pick<Part2Item, "answer">, index: number): boolean {
  return index === item.answer;
}

/**
 * PART1·2 의 시도 결과 → status.
 * 1차 오답은 "wrong"(힌트 후 재도전), 2차 오답은 "revealed"(정답 공개).
 */
export function choiceStatus(correct: boolean, tries: number): AttemptStatus {
  if (correct) return "correct";
  return tries >= 2 ? "revealed" : "wrong";
}

/**
 * PART3 입력 정리 — 앞뒤 공백, 연속 공백, 끝의 마침표를 걷어 낸다.
 * 빈칸이 앞 낱말에 붙어 있는 문항("선생님___")에서 학생이 앞 낱말까지 다시 쓴 경우
 * ("선생님께서") 그 낱말도 떼어 낸다.
 */
export function normalizePart3(text: string, before = ""): string {
  let t = text.normalize("NFC").replace(/\s+/g, " ").trim();
  t = t.replace(/[.。!?~\s]+$/u, "");
  if (before && !/\s$/.test(before)) {
    const glued = before.trim().split(/\s+/).pop() ?? "";
    if (glued && t.startsWith(glued) && t.length > glued.length) {
      t = t.slice(glued.length).trim();
    }
  }
  return t;
}

/**
 * 과거 시제인지 — ㅆ 받침 음절이 있는지 본다 ("쳤다", "봤다", "풀었다", "망쳤다" …).
 * "있다"(현재), "~겠다"(미래)는 ㅆ 받침이어도 과거가 아니므로 뺀다.
 * 낱말을 하나하나 적는 대신 호응 표지를 보는 것이라, 학생이 어떤 서술어를 쓰든 판정된다.
 */
export function hasPastTense(text: string): boolean {
  for (const ch of text) {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) continue; // 한글 음절이 아님
    if (code % 28 === 20 && ch !== "있" && ch !== "겠") return true;
  }
  return false;
}

/** accept 에 정규식 대신 쓸 수 있는 이름 붙은 검사 (정규식으로 쓰기 어려운 것만) */
const NAMED_CHECKS: Record<string, (text: string) => boolean> = {
  "@과거": hasPastTense,
};

/**
 * PART3: accept 중 하나라도 맞으면 "ok", 아니면 "needs-check".
 * accept 항목은 정규식이거나 "@과거" 같은 이름 붙은 검사.
 * 특정 낱말이 아니라 호응 표지(과거·높임·부정 …)를 본다 — 빈칸에 올 수 있는 서술어는 여러 가지이므로.
 * needs-check 는 오답이 아니라 "앱이 모르겠다"는 뜻 — 느슨하게 두고 교사가 본다.
 */
export function judgePart3(
  item: Pick<Part3Item, "accept" | "before">,
  text: string
): "ok" | "needs-check" {
  const t = normalizePart3(text, item.before);
  if (!t) return "needs-check";
  for (const pattern of item.accept) {
    if (pattern.startsWith("@")) {
      if (NAMED_CHECKS[pattern]?.(t)) return "ok";
      continue;
    }
    try {
      if (new RegExp(pattern).test(t)) return "ok";
    } catch {
      // 잘못 쓴 정규식은 건너뛴다 (문항 JSON 을 교사가 직접 고치므로)
    }
  }
  return "needs-check";
}
