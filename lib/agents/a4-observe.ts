import { readFile } from "fs/promises";
import path from "path";
import { callClaude } from "@/lib/claude";
import type { DebateSessionState } from "@/lib/types/session";

export async function runA4(session: DebateSessionState): Promise<DebateSessionState["A4"]> {
  const system = await readFile(path.join(process.cwd(), "prompts/a4.md"), "utf-8");
  const turns = session.A3?.turns ?? [];

  const turnLog = turns
    .map((t) => `[${t.speaker === "student" ? "학생" : "AI"}][${t.phase}][${t.side}] ${t.text}`)
    .join("\n\n");

  const user = `다음은 토론 전체 대화 기록입니다. 학생 발언을 분석하여 평가해주세요.\n\n${turnLog}`;

  const raw = await callClaude({ system, user, responseFormat: "json" });
  return JSON.parse(raw) as NonNullable<DebateSessionState["A4"]>;
}
