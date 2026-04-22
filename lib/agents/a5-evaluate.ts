import { readFile } from "fs/promises";
import path from "path";
import { callClaude } from "@/lib/claude";
import type { DebateSessionState } from "@/lib/types/session";

export async function runA5(session: DebateSessionState): Promise<DebateSessionState["A5"]> {
  const system = await readFile(path.join(process.cwd(), "prompts/a5.md"), "utf-8");
  const obs = session.A4?.perStudent[0];
  const rubric = session.A2?.rubric;

  if (!obs) throw new Error("A4 관찰 결과가 없습니다.");

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
${Object.entries(obs.quotes).map(([k, v]) => `- ${k}: "${v}"`).join("\n")}
`.trim();

  const raw = await callClaude({ system, user, responseFormat: "json" });
  return JSON.parse(raw) as NonNullable<DebateSessionState["A5"]>;
}
