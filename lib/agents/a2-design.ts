import { readFile } from "fs/promises";
import path from "path";
import { callClaude } from "@/lib/claude";
import { lookupAchievements } from "@/lib/curriculum";
import type { DebateSessionState } from "@/lib/types/session";

export async function runA2(session: DebateSessionState): Promise<DebateSessionState["A2"]> {
  const system = await readFile(path.join(process.cwd(), "prompts/a2.md"), "utf-8");
  const { topic, grade, subject, semester, publisher, mainUnit } = session.meta;
  const chosen = session.A1?.chosen ?? "";
  const chosenProblem = session.A1?.problems.find((p) => p.id === chosen);

  let achievementsBlock = "";
  if (grade && subject) {
    const items = await lookupAchievements(grade, subject);
    if (items.length > 0) {
      achievementsBlock = [
        `성취기준 후보 (해당 학년군·교과 — 지도안의 '성취기준' 항목에 가장 관련성 높은 1~3개의 코드+본문을 반영하세요):`,
        ...items.map((it) => `- ${it.code} (${it.domain}) ${it.text}`),
      ].join("\n");
    }
  }

  const user = [
    `수업 주제: ${topic}`,
    `선택된 학습문제: ${chosenProblem?.text ?? chosen}`,
    grade ? `학년: ${grade}` : "",
    semester ? `학기: ${semester}` : "",
    subject ? `교과: ${subject}` : "",
    publisher ? `교과서: ${publisher}` : "",
    mainUnit ? `대단원: ${mainUnit}` : "",
    achievementsBlock,
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await callClaude({ system, user, responseFormat: "json", maxTokens: 6000 });
  return JSON.parse(raw) as NonNullable<DebateSessionState["A2"]>;
}
