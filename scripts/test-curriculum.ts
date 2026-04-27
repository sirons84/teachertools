import { lookupTextbook, lookupAchievements } from "../lib/curriculum";

async function main() {
  // 1) 국정 — 1학년 1학기 국어
  const r1 = await lookupTextbook("1학년", "1학기", "국어");
  console.log("1) 1학년 1학기 국어:", r1);

  // 2) 검정 — 3학년 1학기 사회 (출판사 미지정)
  const r2 = await lookupTextbook("3학년", "1학기", "사회");
  console.log("2) 3학년 1학기 사회 (no pub):", r2);

  // 3) 검정 — 3학년 1학기 사회 + 비상교육
  const r3 = await lookupTextbook("3학년", "1학기", "사회", "비상교육");
  console.log("3) 3학년 1학기 사회 (비상교육):", r3);

  // 4) "초3" 형식
  const r4 = await lookupTextbook("초3", "1학기", "사회", "미래엔");
  console.log("4) 초3 1학기 사회 (미래엔):", r4);

  // 5) 교과 없음
  const r5 = await lookupTextbook("3학년", "1학기", "독서");
  console.log("5) 3학년 1학기 독서:", r5);

  // 6) 성취기준 — 3학년 사회
  const a1 = await lookupAchievements("3학년", "사회");
  console.log("6) 3학년 사회 성취기준 개수:", a1.length, "샘플:", a1.slice(0, 2));

  // 7) 성취기준 — 1학년 국어, domain 필터
  const a2 = await lookupAchievements("1학년", "국어", "듣기⋅말하기");
  console.log("7) 1학년 국어 듣기말하기:", a2.length, "샘플:", a2.slice(0, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
