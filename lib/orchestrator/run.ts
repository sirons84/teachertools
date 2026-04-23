import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { runA1 } from "@/lib/agents/a1-problem";
import { runA2 } from "@/lib/agents/a2-design";
import { runA4 } from "@/lib/agents/a4-observe";
import { runA5 } from "@/lib/agents/a5-evaluate";
import { runA6 } from "@/lib/agents/a6-record";
import { MVP_THREAD_COUNT, type DebateSessionState, type DebateThread, type SessionStage } from "@/lib/types/session";

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

type StageTransition = {
  next: SessionStage;
  run: (state: DebateSessionState) => Promise<Partial<DebateSessionState>>;
};

const STAGE_MAP: Partial<Record<SessionStage, StageTransition>> = {
  A1_READY: {
    next: "A1_DONE_WAIT_APPROVAL",
    run: async (state) => ({ A1: await runA1(state) }),
  },
  A2_READY: {
    next: "A2_DONE",
    run: async (state) => ({ A2: await runA2(state) }),
  },
  // A2_DONE → A3: run route sets stage to A3_READY first (with level), then this fires to init threads
  A3_READY: {
    next: "A3_RUNNING",
    run: async (state) => ({
      A3: {
        level: state.A3?.level ?? "중급",
        threads: state.A3?.threads?.length ? state.A3.threads : makeThreads(),
      },
    }),
  },
  // A3_DONE: run A4 per-thread → go straight to A4_DONE
  A3_DONE: {
    next: "A4_DONE",
    run: async (state) => ({ A4: await runA4(state) }),
  },
  // A4_DONE: run A5 per-thread → wait for teacher approval
  A4_DONE: {
    next: "A5_DONE_WAIT_APPROVAL",
    run: async (state) => ({ A5: await runA5(state) }),
  },
  A6_READY: {
    next: "A6_DONE",
    run: async (state) => ({ A6: await runA6(state) }),
  },
  A6_DONE: {
    next: "COMPLETED",
    run: async (state) => state,
  },
};

export async function runNext(sessionId: string) {
  const session = await prisma.debateSession.findUniqueOrThrow({ where: { id: sessionId } });
  const currentStage = session.stage as SessionStage;
  const transition = STAGE_MAP[currentStage];

  if (!transition) {
    throw new Error(`실행할 수 없는 단계입니다: ${currentStage}`);
  }

  const currentState = session.state as unknown as DebateSessionState;
  const updates = await transition.run(currentState);
  const newState = { ...currentState, ...updates };

  await prisma.debateSession.update({
    where: { id: sessionId },
    data: { state: toJson(newState), stage: transition.next },
  });

  return { state: newState, stage: transition.next };
}

export async function approveSession(sessionId: string, comment?: string) {
  const session = await prisma.debateSession.findUniqueOrThrow({ where: { id: sessionId } });
  const currentStage = session.stage as SessionStage;
  const currentState = session.state as unknown as DebateSessionState;

  const APPROVAL_MAP: Partial<Record<SessionStage, { nextStage: SessionStage; approvalKey: keyof DebateSessionState["approvals"] }>> = {
    A1_DONE_WAIT_APPROVAL: { nextStage: "A2_READY", approvalKey: "afterA1" },
    A5_DONE_WAIT_APPROVAL: { nextStage: "A6_READY", approvalKey: "afterA5" },
  };

  const approval = APPROVAL_MAP[currentStage];
  if (!approval) throw new Error(`승인할 수 없는 단계입니다: ${currentStage}`);

  const newState: DebateSessionState = {
    ...currentState,
    approvals: {
      ...currentState.approvals,
      [approval.approvalKey]: comment ?? new Date().toISOString(),
    },
  };

  await prisma.debateSession.update({
    where: { id: sessionId },
    data: { state: toJson(newState), stage: approval.nextStage },
  });

  return { state: newState, stage: approval.nextStage };
}
