import { readFile } from "fs/promises";
import path from "path";
import { callClaude } from "@/lib/claude";
import type { DebateSessionState } from "@/lib/types/session";

export async function runA1(session: DebateSessionState): Promise<DebateSessionState["A1"]> {
  const system = await readFile(path.join(process.cwd(), "prompts/a1.md"), "utf-8");
  const { topic, grade, subject } = session.meta;

  const user = [
    `수업 주제: ${topic}`,
    grade ? `학년: ${grade}` : "",
    subject ? `교과: ${subject}` : "",
  ].filter(Boolean).join("\n");

  const raw = await callClaude({ system, user, responseFormat: "json" });
  const parsed = JSON.parse(raw) as { problems: NonNullable<DebateSessionState["A1"]>["problems"] };
  return { problems: parsed.problems };
}
