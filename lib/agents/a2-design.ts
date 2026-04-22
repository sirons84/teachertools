import { readFile } from "fs/promises";
import path from "path";
import { callClaude } from "@/lib/claude";
import type { DebateSessionState } from "@/lib/types/session";

export async function runA2(session: DebateSessionState): Promise<DebateSessionState["A2"]> {
  const system = await readFile(path.join(process.cwd(), "prompts/a2.md"), "utf-8");
  const { topic, grade, subject } = session.meta;
  const chosen = session.A1?.chosen ?? "";
  const chosenProblem = session.A1?.problems.find((p) => p.id === chosen);

  const user = [
    `수업 주제: ${topic}`,
    `선택된 학습문제: ${chosenProblem?.text ?? chosen}`,
    grade ? `학년: ${grade}` : "",
    subject ? `교과: ${subject}` : "",
  ].filter(Boolean).join("\n");

  const raw = await callClaude({ system, user, responseFormat: "json", maxTokens: 6000 });
  return JSON.parse(raw) as NonNullable<DebateSessionState["A2"]>;
}
