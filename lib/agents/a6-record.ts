import { readFile } from "fs/promises";
import path from "path";
import { callClaude } from "@/lib/claude";
import type { DebateSessionState, DebateThread, StudentA5, StudentA6, StudentObservation } from "@/lib/types/session";

async function recordOne(
  system: string,
  session: DebateSessionState,
  thread: DebateThread,
  obs: StudentObservation,
  a5: StudentA5,
  teacherNotes: string[],
): Promise<StudentA6> {
  const chosenProblem = session.A1?.problems.find((p) => p.id === session.A1?.chosen);
  const label = thread.studentLabel ?? `학생${thread.index + 1}`;

  const user = `
## 수업 정보
- 주제: ${session.meta.topic}
- 학습문제: ${chosenProblem?.text ?? ""}
- 학년: ${session.meta.grade ?? "미지정"} / 교과: ${session.meta.subject ?? "미지정"}

## 학생 정보
- 식별: ${label}
- 토론 입장: ${thread.position ?? "미지정"}
- 토론 수준: ${session.A3?.level ?? "중급"}

## 최종 평가
- 성취 수준: ${a5.grade}
- 총점: ${a5.totalScore}/100
- 종합 의견: ${a5.evidence?.overall ?? ""}

## 관찰 점수
- 논리성: ${obs.logical}/20
- 근거타당성: ${obs.evidence}/20
- 반박력: ${obs.rebuttal}/20
- 이해도: ${obs.understanding}/20
- 태도·구조: ${obs.attitude}/20

${teacherNotes.length ? `## 교사 정성 피드백 (생기부에 자연스럽게 녹여주세요)\n${teacherNotes.map((n) => `- ${n}`).join("\n")}\n` : ""}`.trim();

  const raw = await callClaude({ system, user, responseFormat: "json" });
  return JSON.parse(raw) as StudentA6;
}

export async function runA6(session: DebateSessionState): Promise<DebateSessionState["A6"]> {
  const system = await readFile(path.join(process.cwd(), "prompts/a6.md"), "utf-8");
  const threads = session.A3?.threads ?? [];
  const observations = session.A4?.perStudent ?? [];
  const evaluations = session.A5?.perStudent ?? [];

  const perStudent = await Promise.all(
    threads.map(async (thread) => {
      const obs = observations.find((o) => o.threadId === thread.id);
      const a5 = evaluations.find((e) => e.threadId === thread.id);
      if (!obs || !a5) {
        return { threadId: thread.id, cumulative: "", subjectDev: "" };
      }
      const notes = session.teacherNotes?.[thread.id] ?? [];
      const record = await recordOne(system, session, thread, obs, a5, notes);
      return { threadId: thread.id, ...record };
    })
  );

  return { perStudent };
}
