export type SessionStage =
  | "A1_READY" | "A1_DONE_WAIT_APPROVAL"
  | "A2_READY" | "A2_DONE"
  | "A3_READY" | "A3_RUNNING" | "A3_DONE"
  | "A4_READY" | "A4_DONE"
  | "A5_READY" | "A5_DONE_WAIT_APPROVAL"
  | "A6_READY" | "A6_DONE"
  | "COMPLETED";

export const RUBRIC = [
  { id: "logical",       name: "논리성",     max: 20 },
  { id: "evidence",      name: "근거타당성",  max: 20 },
  { id: "rebuttal",      name: "반박력",     max: 20 },
  { id: "understanding", name: "이해도",     max: 20 },
  { id: "attitude",      name: "태도·구조",  max: 20 },
] as const;

export type RubricKey = typeof RUBRIC[number]["id"];

export interface RubricSchema {
  criteria: Array<{ id: RubricKey; name: string; max: number; descriptor: string }>;
}

export interface Turn {
  id: string;
  speaker: "student" | "bot";
  side: "찬성" | "반대";
  phase: "입론" | "반론" | "최후변론";
  text: string;
}

export interface Problem {
  id: string;
  text: string;
  reason: string;
  score: number;
}

export interface StudentObservation {
  logical: number;
  evidence: number;
  rebuttal: number;
  understanding: number;
  attitude: number;
  quotes: Record<string, string>;
}

export interface DebateSessionState {
  sessionId: string;
  meta: { topic: string; grade?: string; subject?: string };
  A1?: {
    problems: Problem[];
    chosen?: string;
  };
  A2?: {
    lessonPlan: string;
    rubric: RubricSchema;
    twoWayTable: string;
  };
  A3?: {
    level: "초급" | "중급" | "고급";
    studentPosition: "찬성" | "반대";
    turns: Turn[];
  };
  A4?: {
    perStudent: StudentObservation[];
  };
  A5?: {
    grade: "상" | "중" | "하";
    totalScore: number;
    evidence: Record<string, string>;
  };
  A6?: {
    cumulative: string;
    subjectDev: string;
  };
  approvals: {
    afterA1?: string;
    afterA5?: string;
  };
}
