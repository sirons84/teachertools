import { readFile } from "fs/promises";
import path from "path";
import { callClaude } from "@/lib/claude";
import type { DebateSessionState, StudentObservation, Turn } from "@/lib/types/session";

async function observeTurns(system: string, turns: Turn[]): Promise<StudentObservation> {
  const turnLog = turns
    .map((t) => `[${t.speaker === "student" ? "학생" : "AI"}][${t.phase}][${t.side}] ${t.text}`)
    .join("\n\n");

  const user = `다음은 토론 전체 대화 기록입니다. 학생 발언을 분석하여 평가해주세요.\n\n${turnLog}`;
  const raw = await callClaude({ system, user, responseFormat: "json" });
  const parsed = JSON.parse(raw) as { perStudent?: StudentObservation[] } | StudentObservation;

  if ("perStudent" in parsed && parsed.perStudent?.[0]) return parsed.perStudent[0];
  return parsed as StudentObservation;
}

export async function runA4(session: DebateSessionState): Promise<DebateSessionState["A4"]> {
  const system = await readFile(path.join(process.cwd(), "prompts/a4.md"), "utf-8");
  const threads = session.A3?.threads ?? [];

  const perStudent = await Promise.all(
    threads.map(async (thread) => {
      if (thread.turns.length === 0) {
        return {
          threadId: thread.id,
          logical: 0, evidence: 0, rebuttal: 0, understanding: 0, attitude: 0,
          quotes: {},
        };
      }
      const obs = await observeTurns(system, thread.turns);
      return { threadId: thread.id, ...obs };
    })
  );

  return { perStudent };
}
