import type {
  DebateSessionState,
  DebateThread,
  OrchestratorAction,
} from "@/lib/types/session";

// indices는 학생 번호(1~5). 배열 인덱스로 변환해 유효한 쓰레드만 반환.
function threadsByIndices(threads: DebateThread[], indices: number[]): DebateThread[] {
  return indices
    .map((i) => threads.find((t) => t.index === i - 1))
    .filter((t): t is DebateThread => !!t);
}

export function applyAction(
  state: DebateSessionState,
  action: OrchestratorAction,
): DebateSessionState {
  const threads = state.A3?.threads ?? [];
  if (threads.length === 0) return state;

  const now = new Date().toISOString();
  const targets = threadsByIndices(threads, action.indices);
  const targetIds = new Set(targets.map((t) => t.id));

  switch (action.type) {
    case "finishThreads": {
      const updatedThreads = threads.map((t) =>
        targetIds.has(t.id) ? { ...t, status: "finished" as const, lastActivityAt: now } : t
      );
      return { ...state, A3: { ...state.A3!, threads: updatedThreads } };
    }

    case "restartThreads": {
      const updatedThreads = threads.map((t) =>
        targetIds.has(t.id)
          ? { ...t, turns: [], status: "active" as const, lastActivityAt: now }
          : t
      );
      return { ...state, A3: { ...state.A3!, threads: updatedThreads } };
    }

    case "addNote": {
      const notes = { ...(state.teacherNotes ?? {}) };
      for (const id of targetIds) {
        notes[id] = [...(notes[id] ?? []), action.note];
      }
      // A5가 이미 생성됐다면 evidence에 즉시 반영
      let A5 = state.A5;
      if (A5?.perStudent) {
        A5 = {
          ...A5,
          perStudent: A5.perStudent.map((p) =>
            targetIds.has(p.threadId)
              ? {
                  ...p,
                  evidence: {
                    ...p.evidence,
                    teacherNote: [p.evidence?.teacherNote, action.note].filter(Boolean).join(" / "),
                  },
                }
              : p
          ),
        };
      }
      return { ...state, teacherNotes: notes, A5 };
    }

    case "setGrade": {
      const overrides = { ...(state.gradeOverrides ?? {}) };
      for (const id of targetIds) {
        overrides[id] = action.grade;
      }
      // A5가 이미 있으면 grade를 즉시 덮어쓰기
      let A5 = state.A5;
      if (A5?.perStudent) {
        A5 = {
          ...A5,
          perStudent: A5.perStudent.map((p) =>
            targetIds.has(p.threadId) ? { ...p, grade: action.grade } : p
          ),
        };
      }
      return { ...state, gradeOverrides: overrides, A5 };
    }

    default:
      return state;
  }
}

export function applyActions(
  state: DebateSessionState,
  actions: OrchestratorAction[],
): DebateSessionState {
  return actions.reduce((acc, action) => applyAction(acc, action), state);
}

// LLM 출력 유효성 검증
export function sanitizeActions(raw: unknown): OrchestratorAction[] {
  if (!Array.isArray(raw)) return [];
  const out: OrchestratorAction[] = [];
  for (const a of raw) {
    if (!a || typeof a !== "object") continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = a as any;
    const indices = Array.isArray(obj.indices)
      ? obj.indices.filter((n: unknown) => typeof n === "number" && Number.isInteger(n))
      : [];
    if (indices.length === 0) continue;

    if (obj.type === "finishThreads" || obj.type === "restartThreads") {
      out.push({ type: obj.type, indices });
    } else if (obj.type === "addNote" && typeof obj.note === "string" && obj.note.trim()) {
      out.push({ type: "addNote", indices, note: obj.note.trim() });
    } else if (obj.type === "setGrade" && (obj.grade === "상" || obj.grade === "중" || obj.grade === "하")) {
      out.push({ type: "setGrade", indices, grade: obj.grade });
    }
  }
  return out;
}
