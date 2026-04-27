import { randomUUID } from "crypto";
import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { prisma } from "@/lib/db";
import { runA1 } from "@/lib/agents/a1-problem";
import { runA2 } from "@/lib/agents/a2-design";
import { runA4 } from "@/lib/agents/a4-observe";
import { runA5 } from "@/lib/agents/a5-evaluate";
import { runA6 } from "@/lib/agents/a6-record";
import { applyActions } from "@/lib/orchestrator/actions";
import {
  MVP_THREAD_COUNT,
  type DebateSessionState,
  type DebateThread,
  type SessionStage,
} from "@/lib/types/session";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toJson(state: DebateSessionState): any {
  return JSON.parse(JSON.stringify(state));
}

function makeThreads(): DebateThread[] {
  return Array.from({ length: MVP_THREAD_COUNT }, (_, i) => ({
    id: randomUUID().replace(/-/g, ""),
    index: i,
    position: null,
    status: "pending" as const,
    turns: [],
  }));
}

export const ORCHESTRATOR_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "set_topic",
      description: "수업 주제·학년·교과를 등록합니다. 첫 대화에서 교사가 알려준 정보를 저장할 때 사용합니다.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "수업 주제 (예: '민주주의에서 다수결의 한계')" },
          grade: { type: "string", description: "학년 (예: '초5', '중2', '고1'). 모르면 생략." },
          subject: { type: "string", description: "교과 (예: '사회', '국어'). 모르면 생략." },
        },
        required: ["topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "discover_problems",
      description: "현재 수업 주제로부터 학습문제 후보 3개를 생성합니다. set_topic이 먼저 호출되어 있어야 합니다.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "choose_problem",
      description: "discover_problems가 만든 후보 중 하나를 학습문제로 확정합니다.",
      parameters: {
        type: "object",
        properties: {
          problemId: { type: "string", description: "확정할 problem의 id" },
        },
        required: ["problemId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "design_lesson",
      description: "선택된 학습문제를 토대로 지도안·루브릭·이원목적분류표를 생성합니다.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "start_debate",
      description: "5명 학생 토론 스레드를 만듭니다. 학생들은 발급되는 링크로 입장합니다.",
      parameters: {
        type: "object",
        properties: {
          level: { type: "string", enum: ["초급", "중급", "고급"], description: "토론 난이도" },
        },
        required: ["level"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_status",
      description: "현재 세션의 단계와 5개 스레드의 진행 상황을 반환합니다.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "finish_threads",
      description: "지정 학생의 토론을 강제 종료합니다.",
      parameters: {
        type: "object",
        properties: {
          numbers: { type: "array", items: { type: "integer", minimum: 1, maximum: 5 } },
        },
        required: ["numbers"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "restart_threads",
      description: "지정 학생의 토론을 초기화하고 재시작합니다.",
      parameters: {
        type: "object",
        properties: {
          numbers: { type: "array", items: { type: "integer", minimum: 1, maximum: 5 } },
        },
        required: ["numbers"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_note",
      description: "교사 정성 피드백 메모를 학생에게 추가합니다 (이후 평가·생기부에 반영).",
      parameters: {
        type: "object",
        properties: {
          numbers: { type: "array", items: { type: "integer", minimum: 1, maximum: 5 } },
          note: { type: "string" },
        },
        required: ["numbers", "note"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_grade",
      description: "지정 학생의 최종 성취 수준을 강제 지정합니다.",
      parameters: {
        type: "object",
        properties: {
          numbers: { type: "array", items: { type: "integer", minimum: 1, maximum: 5 } },
          grade: { type: "string", enum: ["상", "중", "하"] },
        },
        required: ["numbers", "grade"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "finish_debate_phase",
      description: "전체 토론 단계(A3)를 마치고 관찰 단계로 넘어갑니다. 모든 active 스레드는 finished로 전환됩니다.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "observe_students",
      description: "5개 토론 기록을 분석해 학생별 항목 점수(논리성·근거·반박력·이해도·태도)를 산출합니다.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "evaluate_students",
      description: "관찰 결과로부터 학생별 최종 성취 수준(상/중/하)을 판정합니다.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "approve_evaluation",
      description: "교사가 평가 결과를 승인합니다. 이후 생기부 작성을 진행할 수 있습니다.",
      parameters: {
        type: "object",
        properties: {
          comment: { type: "string", description: "선택적 코멘트" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_records",
      description: "5명의 누가기록·교과학습발달상황 초안을 작성합니다.",
      parameters: { type: "object", properties: {} },
    },
  },
];

export interface ToolExecutionResult {
  ok: boolean;
  summary: string;
  data?: unknown;
  newStage?: SessionStage;
}

interface ExecContext {
  sessionId: string;
}

async function loadState(sessionId: string): Promise<{ state: DebateSessionState; stage: SessionStage }> {
  const session = await prisma.debateSession.findUniqueOrThrow({ where: { id: sessionId } });
  return {
    state: session.state as unknown as DebateSessionState,
    stage: session.stage as SessionStage,
  };
}

async function saveState(
  sessionId: string,
  state: DebateSessionState,
  stage?: SessionStage,
) {
  await prisma.debateSession.update({
    where: { id: sessionId },
    data: stage ? { state: toJson(state), stage } : { state: toJson(state) },
  });
}

const TOOL_HANDLERS: Record<
  string,
  (args: Record<string, unknown>, ctx: ExecContext) => Promise<ToolExecutionResult>
> = {
  async set_topic(args, ctx) {
    const topic = String(args.topic ?? "").trim();
    if (!topic) return { ok: false, summary: "topic이 비어 있습니다." };
    const grade = typeof args.grade === "string" ? args.grade : undefined;
    const subject = typeof args.subject === "string" ? args.subject : undefined;

    const { state } = await loadState(ctx.sessionId);
    const newState: DebateSessionState = {
      ...state,
      meta: { topic, grade, subject },
    };
    await prisma.debateSession.update({
      where: { id: ctx.sessionId },
      data: { state: toJson(newState), topic, grade: grade ?? null, subject: subject ?? null },
    });
    return {
      ok: true,
      summary: `주제 "${topic}" 등록${grade ? ` (학년 ${grade})` : ""}${subject ? ` (교과 ${subject})` : ""}`,
      data: { topic, grade, subject },
    };
  },

  async discover_problems(_args, ctx) {
    const { state } = await loadState(ctx.sessionId);
    if (!state.meta?.topic) {
      return { ok: false, summary: "주제가 아직 설정되지 않았습니다. 먼저 set_topic을 호출하세요." };
    }
    const A1 = await runA1(state);
    const newState: DebateSessionState = { ...state, A1 };
    await saveState(ctx.sessionId, newState, "A1_DONE_WAIT_APPROVAL");
    return {
      ok: true,
      summary: `학습문제 ${A1?.problems?.length ?? 0}개 생성`,
      data: { problems: A1?.problems ?? [] },
      newStage: "A1_DONE_WAIT_APPROVAL",
    };
  },

  async choose_problem(args, ctx) {
    const problemId = String(args.problemId ?? "").trim();
    if (!problemId) return { ok: false, summary: "problemId가 비어 있습니다." };

    const { state } = await loadState(ctx.sessionId);
    if (!state.A1?.problems?.length) {
      return { ok: false, summary: "학습문제 후보가 없습니다. 먼저 discover_problems를 호출하세요." };
    }
    const found = state.A1.problems.find((p) => p.id === problemId);
    if (!found) return { ok: false, summary: `problemId "${problemId}"를 찾을 수 없습니다.` };

    const newState: DebateSessionState = {
      ...state,
      A1: { ...state.A1, chosen: problemId },
      approvals: { ...state.approvals, afterA1: new Date().toISOString() },
    };
    await saveState(ctx.sessionId, newState, "A2_READY");
    return {
      ok: true,
      summary: `학습문제 확정: "${found.text}"`,
      data: { chosen: found },
      newStage: "A2_READY",
    };
  },

  async design_lesson(_args, ctx) {
    const { state } = await loadState(ctx.sessionId);
    if (!state.A1?.chosen) {
      return { ok: false, summary: "학습문제가 확정되지 않았습니다. 먼저 choose_problem을 호출하세요." };
    }
    const A2 = await runA2(state);
    const newState: DebateSessionState = { ...state, A2 };
    await saveState(ctx.sessionId, newState, "A2_DONE");
    return {
      ok: true,
      summary: "지도안·루브릭·이원목적분류표 생성 완료",
      newStage: "A2_DONE",
    };
  },

  async start_debate(args, ctx) {
    const level = (args.level === "초급" || args.level === "고급" ? args.level : "중급") as
      | "초급"
      | "중급"
      | "고급";
    const { state } = await loadState(ctx.sessionId);
    if (!state.A2) {
      return { ok: false, summary: "지도안이 없습니다. 먼저 design_lesson을 호출하세요." };
    }
    const threads = state.A3?.threads?.length ? state.A3.threads : makeThreads();
    const newState: DebateSessionState = {
      ...state,
      A3: { level, threads },
    };
    await saveState(ctx.sessionId, newState, "A3_RUNNING");
    return {
      ok: true,
      summary: `${level} 토론방 ${threads.length}개 생성. 학생 입장 링크가 발급되었습니다.`,
      data: { level, threadCount: threads.length },
      newStage: "A3_RUNNING",
    };
  },

  async get_status(_args, ctx) {
    const { state, stage } = await loadState(ctx.sessionId);
    const threads = state.A3?.threads ?? [];
    const summary = threads.map((t) => ({
      number: t.index + 1,
      status: t.status,
      position: t.position,
      studentTurns: Math.floor(t.turns.length / 2),
    }));
    return {
      ok: true,
      summary: `단계 ${stage}, 스레드 ${threads.length}개`,
      data: { stage, meta: state.meta, threads: summary },
    };
  },

  async finish_threads(args, ctx) {
    const numbers = Array.isArray(args.numbers)
      ? (args.numbers as unknown[]).filter((n): n is number => typeof n === "number")
      : [];
    if (numbers.length === 0) return { ok: false, summary: "numbers가 비어 있습니다." };
    const { state } = await loadState(ctx.sessionId);
    const newState = applyActions(state, [{ type: "finishThreads", indices: numbers }]);
    await saveState(ctx.sessionId, newState);
    return { ok: true, summary: `${numbers.join(", ")}번 토론 종료`, data: { numbers } };
  },

  async restart_threads(args, ctx) {
    const numbers = Array.isArray(args.numbers)
      ? (args.numbers as unknown[]).filter((n): n is number => typeof n === "number")
      : [];
    if (numbers.length === 0) return { ok: false, summary: "numbers가 비어 있습니다." };
    const { state } = await loadState(ctx.sessionId);
    const newState = applyActions(state, [{ type: "restartThreads", indices: numbers }]);
    await saveState(ctx.sessionId, newState);
    return { ok: true, summary: `${numbers.join(", ")}번 토론 재시작`, data: { numbers } };
  },

  async add_note(args, ctx) {
    const numbers = Array.isArray(args.numbers)
      ? (args.numbers as unknown[]).filter((n): n is number => typeof n === "number")
      : [];
    const note = String(args.note ?? "").trim();
    if (numbers.length === 0 || !note) return { ok: false, summary: "numbers/note가 비어 있습니다." };
    const { state } = await loadState(ctx.sessionId);
    const newState = applyActions(state, [{ type: "addNote", indices: numbers, note }]);
    await saveState(ctx.sessionId, newState);
    return { ok: true, summary: `${numbers.join(", ")}번에 메모 추가: "${note.slice(0, 30)}"`, data: { numbers, note } };
  },

  async set_grade(args, ctx) {
    const numbers = Array.isArray(args.numbers)
      ? (args.numbers as unknown[]).filter((n): n is number => typeof n === "number")
      : [];
    const grade = args.grade === "상" || args.grade === "중" || args.grade === "하" ? args.grade : null;
    if (numbers.length === 0 || !grade) return { ok: false, summary: "numbers/grade가 비어 있습니다." };
    const { state } = await loadState(ctx.sessionId);
    const newState = applyActions(state, [{ type: "setGrade", indices: numbers, grade }]);
    await saveState(ctx.sessionId, newState);
    return { ok: true, summary: `${numbers.join(", ")}번 평가 → ${grade}`, data: { numbers, grade } };
  },

  async finish_debate_phase(_args, ctx) {
    const { state } = await loadState(ctx.sessionId);
    const threads = state.A3?.threads ?? [];
    if (threads.length === 0) return { ok: false, summary: "토론이 아직 시작되지 않았습니다." };
    const now = new Date().toISOString();
    const finished = threads.map((t) =>
      t.status === "pending" ? t : { ...t, status: "finished" as const, lastActivityAt: now },
    );
    const newState: DebateSessionState = {
      ...state,
      A3: { ...state.A3!, threads: finished },
    };
    await saveState(ctx.sessionId, newState, "A3_DONE");
    return { ok: true, summary: "토론 종료, 관찰 단계로 진입", newStage: "A3_DONE" };
  },

  async observe_students(_args, ctx) {
    const { state } = await loadState(ctx.sessionId);
    if (!state.A3?.threads?.length) return { ok: false, summary: "토론 기록이 없습니다." };
    const A4 = await runA4(state);
    const newState: DebateSessionState = { ...state, A4 };
    await saveState(ctx.sessionId, newState, "A4_DONE");
    return { ok: true, summary: "5명 관찰 분석 완료", newStage: "A4_DONE" };
  },

  async evaluate_students(_args, ctx) {
    const { state } = await loadState(ctx.sessionId);
    if (!state.A4?.perStudent?.length) return { ok: false, summary: "관찰 결과가 없습니다." };
    const A5 = await runA5(state);
    const newState: DebateSessionState = { ...state, A5 };
    await saveState(ctx.sessionId, newState, "A5_DONE_WAIT_APPROVAL");
    const summary = (A5?.perStudent ?? [])
      .map((p, i) => `${i + 1}번 ${p.grade}`)
      .join(", ");
    return { ok: true, summary: `평가 완료: ${summary}`, newStage: "A5_DONE_WAIT_APPROVAL" };
  },

  async approve_evaluation(args, ctx) {
    const { state } = await loadState(ctx.sessionId);
    if (!state.A5?.perStudent?.length) return { ok: false, summary: "평가가 아직 완료되지 않았습니다." };
    const comment = typeof args.comment === "string" ? args.comment : undefined;
    const newState: DebateSessionState = {
      ...state,
      approvals: { ...state.approvals, afterA5: comment ?? new Date().toISOString() },
    };
    await saveState(ctx.sessionId, newState, "A6_READY");
    return { ok: true, summary: "평가 승인 완료, 생기부 작성 가능", newStage: "A6_READY" };
  },

  async generate_records(_args, ctx) {
    const { state } = await loadState(ctx.sessionId);
    if (!state.A5?.perStudent?.length) return { ok: false, summary: "평가가 없습니다." };
    const A6 = await runA6(state);
    const newState: DebateSessionState = { ...state, A6 };
    await saveState(ctx.sessionId, newState, "A6_DONE");
    return { ok: true, summary: "5명 생기부 초안 작성 완료", newStage: "A6_DONE" };
  },
};

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ExecContext,
): Promise<ToolExecutionResult> {
  const handler = TOOL_HANDLERS[name];
  if (!handler) return { ok: false, summary: `알 수 없는 툴: ${name}` };
  try {
    return await handler(args, ctx);
  } catch (err) {
    console.error(`Tool ${name} error:`, err);
    return { ok: false, summary: err instanceof Error ? err.message : "툴 실행 오류" };
  }
}
