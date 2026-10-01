// 문장 호응 체크 — 판정 함수 확인용.
// 실행: node scripts/test-hoeung-judge.mjs   (Node 22.18+ 의 타입 제거 기능으로 .ts 를 바로 읽는다)
// 문항 JSON(data/hoeung-items.json)의 accept 정규식을 고친 뒤 여기 CASES 에 사례를 더해 돌려 본다.

import { readFileSync } from "node:fs";
import { judgePart1, judgePart2, judgePart3, choiceStatus, normalizePart3 } from "../lib/hoeung/judge.ts";

const items = JSON.parse(readFileSync(new URL("../data/hoeung-items.json", import.meta.url), "utf8"));
const p3 = Object.fromEntries(items.part3.items.map((it) => [it.id, it]));

let failed = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? "  ok  " : "  FAIL"} ${label} → ${actual}${ok ? "" : ` (기대: ${expected})`}`);
}

console.log("PART1·2");
for (const it of items.part1.items) {
  check(`${it.id} 정답 어절 "${it.chips[it.answer]}"`, judgePart1(it, it.answer), true);
  check(`${it.id} 다른 어절`, judgePart1(it, (it.answer + 1) % it.chips.length), false);
}
for (const it of items.part2.items) {
  check(`${it.id} 정답 "${it.choices[it.answer]}"`, judgePart2(it, it.answer), true);
  check(`${it.id} 다른 보기`, judgePart2(it, (it.answer + 1) % it.choices.length), false);
}
check("1차 오답", choiceStatus(false, 1), "wrong");
check("2차 오답", choiceStatus(false, 2), "revealed");
check("2차 정답", choiceStatus(true, 2), "correct");

console.log("PART3 정리");
check('"  쳤다. "', normalizePart3("  쳤다. "), "쳤다");
check('"선생님께서" (앞 낱말 다시 씀)', normalizePart3("선생님께서", "선생님"), "께서");
check('"선생님" 만', normalizePart3("선생님", "선생님"), "선생님");

console.log("PART3 판정");
/** [문항, 입력, 기대] */
const CASES = [
  ["p3-01", "쳤다", "ok"],
  ["p3-01", "쳤다.", "ok"],
  ["p3-01", "봤습니다", "ok"],
  ["p3-01", "보았다", "ok"],
  ["p3-01", "치렀다", "ok"],
  ["p3-01", "쳣다", "ok"],
  ["p3-01", "친다", "needs-check"],
  ["p3-01", "칠 것이다", "needs-check"],
  ["p3-01", "", "needs-check"],
  ["p3-02", "께서", "ok"],
  ["p3-02", " 께서 ", "ok"],
  ["p3-02", "께서는", "ok"],
  ["p3-02", "선생님께서", "ok"],
  ["p3-02", "이", "needs-check"],
  ["p3-02", "은", "needs-check"],
  ["p3-02", "께", "needs-check"],
  ["p3-03", "포기하지 않았다", "ok"],
  ["p3-03", "포기하지 않을 것이다.", "ok"],
  ["p3-03", "멈추지 못했다", "ok"],
  ["p3-03", "포기했다", "needs-check"],
  ["p3-03", "열심히 했다", "needs-check"],
  ["p3-04", "감동적이기 때문이다", "ok"],
  ["p3-04", "재미있었기 때문이다.", "ok"],
  ["p3-04", "감동적이다", "needs-check"],
  ["p3-04", "감동적이었다", "needs-check"],
  ["p3-05", "드신다", "ok"],
  ["p3-05", "드셨다", "ok"],
  ["p3-05", "잡수신다", "ok"],
  ["p3-05", "먹는다", "needs-check"],
  ["p3-05", "먹었다", "needs-check"],
];
for (const [id, input, expected] of CASES) {
  check(`${id} "${input}"`, judgePart3(p3[id], input), expected);
}

for (const it of items.part3.items) {
  check(`${it.id} 모범 답 "${it.model}"`, judgePart3(it, it.model), "ok");
}

console.log(failed === 0 ? "\n모두 통과" : `\n실패 ${failed}건`);
process.exit(failed === 0 ? 0 : 1);
