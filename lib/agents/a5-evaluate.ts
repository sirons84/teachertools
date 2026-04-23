import { readFile } from "fs/promises";
import path from "path";
import { callClaude } from "@/lib/claude";
import type { DebateSessionState, RubricSchema, StudentA5, StudentObservation } from "@/lib/types/session";

async function evaluateOne(
  system: string,
  rubric: RubricSchema | undefined,
  obs: StudentObservation,
  teacherNotes: string[],
): Promise<StudentA5> {
  const user = `
## 루브릭 기준
${rubric?.criteria.map((c) => `- ${c.name}(${c.id}): ${c.descriptor}`).join("\n") ?? "기본 루브릭 사용"}

## 관찰 점수
- 논리성(logical): ${obs.logical}/20
- 근거타당성(evidence): ${obs.evidence}/20
- 반박력(rebuttal): ${obs.rebuttal}/20
- 이해도(understanding): ${obs.understanding}/20
- 태도·구조(attitude): ${obs.attitude}/20

## 인용 근거
${Object.entries(obs.quotes ?? {}).map(([k, v]) => `- ${k}: "${v}"`).join("\n")}

${teacherNotes.length ? `## 교사 정성 피드백 (중요 — 평가에 반드시 반영)\n${teacherNotes.map((n) => `- ${n}`).join("\n")}\n` : ""}`.trim();

  const raw = await callClaude({ system, user, responseFormat: "json" });
  return JSON.parse(raw) as StudentA5;
}

export async function runA5(session: DebateSessionState): Promise<DebateSessionState["A5"]> {
  const system = await readFile(path.join(process.cwd(), "prompts/a5.md"), "utf-8");
  const observations = session.A4?.perStudent ?? [];

  if (observations.length === 0) throw new Error("A4 관찰 결과가 없습니다.");

  const perStudent = await Promise.all(
    observations.map(async (obs) => {
      const notes = session.teacherNotes?.[obs.threadId] ?? [];
      const override = session.gradeOverrides?.[obs.threadId];
      const result = await evaluateOne(system, session.A2?.rubric, obs, notes);
      const evidence = notes.length
        ? { ...result.evidence, teacherNote: notes.join(" / ") }
        : result.evidence;
      return {
        threadId: obs.threadId,
        ...result,
        grade: override ?? result.grade,
        evidence,
      };
    })
  );

  return { perStudent };
}
