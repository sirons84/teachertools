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
 * PART3: accept 정규식 중 하나라도 맞으면 "ok", 아니면 "needs-check".
 * needs-check 는 오답이 아니라 "앱이 모르겠다"는 뜻 — 느슨하게 두고 교사가 본다.
 */
export function judgePart3(
  item: Pick<Part3Item, "accept" | "before">,
  text: string
): "ok" | "needs-check" {
  const t = normalizePart3(text, item.before);
  if (!t) return "needs-check";
  for (const pattern of item.accept) {
    try {
      if (new RegExp(pattern).test(t)) return "ok";
    } catch {
      // 잘못 쓴 정규식은 건너뛴다 (문항 JSON 을 교사가 직접 고치므로)
    }
  }
  return "needs-check";
}
