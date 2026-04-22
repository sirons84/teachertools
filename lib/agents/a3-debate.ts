import { readFile } from "fs/promises";
import path from "path";
import { callClaudeWithHistory } from "@/lib/claude";
import type { DebateSessionState, Turn } from "@/lib/types/session";

export async function runA3Turn(
  session: DebateSessionState,
  studentText: string,
  phase: Turn["phase"]
): Promise<string> {
  const system = await readFile(path.join(process.cwd(), "prompts/a3.md"), "utf-8");

  const chosenProblem = session.A1?.problems.find((p) => p.id === session.A1?.chosen);
  const level = session.A3?.level ?? "중급";
  const studentPosition = session.A3?.studentPosition ?? "찬성";
  const botPosition = studentPosition === "찬성" ? "반대" : "찬성";
  const existingTurns = session.A3?.turns ?? [];

  const systemWithContext = `${system}

## 현재 토론 정보
- 학습문제: ${chosenProblem?.text ?? session.meta.topic}
- 난이도: ${level}
- 학생 입장: ${studentPosition} / 당신 입장: ${botPosition}
- 현재 단계: ${phase}`;

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  for (const turn of existingTurns) {
    if (turn.speaker === "student") {
      messages.push({ role: "user", content: `[${turn.phase}] ${turn.text}` });
    } else {
      messages.push({ role: "assistant", content: turn.text });
    }
  }
  messages.push({ role: "user", content: `[${phase}] ${studentText}` });

  return callClaudeWithHistory({ system: systemWithContext, messages });
}
