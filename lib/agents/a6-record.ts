import { readFile } from "fs/promises";
import path from "path";
import { callClaude } from "@/lib/claude";
import type { DebateSessionState } from "@/lib/types/session";

export async function runA6(session: DebateSessionState): Promise<DebateSessionState["A6"]> {
  const system = await readFile(path.join(process.cwd(), "prompts/a6.md"), "utf-8");
  const chosenProblem = session.A1?.problems.find((p) => p.id === session.A1?.chosen);

  const user = `
## 수업 정보
- 주제: ${session.meta.topic}
- 학습문제: ${chosenProblem?.text ?? ""}
- 학년: ${session.meta.grade ?? "미지정"} / 교과: ${session.meta.subject ?? "미지정"}

## 학생 입장
- 토론 입장: ${session.A3?.studentPosition ?? "미지정"}
- 토론 수준: ${session.A3?.level ?? "중급"}

## 최종 평가
- 성취 수준: ${session.A5?.grade ?? "미지정"}
- 총점: ${session.A5?.totalScore ?? 0}/100
- 종합 의견: ${session.A5?.evidence?.overall ?? ""}

## 관찰 점수
- 논리성: ${session.A4?.perStudent[0]?.logical ?? 0}/20
- 근거타당성: ${session.A4?.perStudent[0]?.evidence ?? 0}/20
- 반박력: ${session.A4?.perStudent[0]?.rebuttal ?? 0}/20
- 이해도: ${session.A4?.perStudent[0]?.understanding ?? 0}/20
- 태도·구조: ${session.A4?.perStudent[0]?.attitude ?? 0}/20
`.trim();

  const raw = await callClaude({ system, user, responseFormat: "json" });
  return JSON.parse(raw) as NonNullable<DebateSessionState["A6"]>;
}
