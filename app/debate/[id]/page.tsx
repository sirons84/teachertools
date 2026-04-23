"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ThreadDashboard from "@/components/debate/ThreadDashboard";
import OrchestratorPanel from "@/components/debate/OrchestratorPanel";
import {
  MIN_TURNS_TO_FINISH,
  type DebateSessionState, type DebateThread, type Problem, type RubricSchema, type SessionStage,
} from "@/lib/types/session";

interface SessionData {
  id: string;
  topic: string;
  grade?: string;
  subject?: string;
  stage: SessionStage;
  state: DebateSessionState;
}

type StageStatus = "done" | "active" | "waiting" | "approval-needed";

const STAGE_META = [
  {
    key: "A1", label: "① 학습문제 제안", icon: "📋",
    activeStages: ["A1_READY"],
    approvalStage: "A1_DONE_WAIT_APPROVAL" as SessionStage,
    doneStages: ["A2_READY", "A2_DONE", "A3_READY", "A3_RUNNING", "A3_DONE", "A4_READY", "A4_DONE", "A5_READY", "A5_DONE_WAIT_APPROVAL", "A6_READY", "A6_DONE", "COMPLETED"],
  },
  {
    key: "A2", label: "② 지도안·평가지", icon: "📝",
    activeStages: ["A2_READY"],
    doneStages: ["A2_DONE", "A3_READY", "A3_RUNNING", "A3_DONE", "A4_READY", "A4_DONE", "A5_READY", "A5_DONE_WAIT_APPROVAL", "A6_READY", "A6_DONE", "COMPLETED"],
  },
  {
    key: "A3", label: "③ AI 토론 (학생 5명)", icon: "💬",
    activeStages: ["A2_DONE", "A3_READY", "A3_RUNNING"],
    doneStages: ["A3_DONE", "A4_READY", "A4_DONE", "A5_READY", "A5_DONE_WAIT_APPROVAL", "A6_READY", "A6_DONE", "COMPLETED"],
  },
  {
    key: "A4", label: "④ 과정 관찰 (5명)", icon: "🔍",
    activeStages: ["A3_DONE", "A4_READY"],
    doneStages: ["A4_DONE", "A5_READY", "A5_DONE_WAIT_APPROVAL", "A6_READY", "A6_DONE", "COMPLETED"],
  },
  {
    key: "A5", label: "⑤ 평가 판정 (5명)", icon: "📊",
    activeStages: ["A4_DONE", "A5_READY"],
    approvalStage: "A5_DONE_WAIT_APPROVAL" as SessionStage,
    doneStages: ["A6_READY", "A6_DONE", "COMPLETED"],
  },
  {
    key: "A6", label: "⑥ 생기부 초안 (5명)", icon: "📄",
    activeStages: ["A6_READY"],
    doneStages: ["A6_DONE", "COMPLETED"],
  },
];

function getStageStatus(meta: typeof STAGE_META[0], currentStage: SessionStage): StageStatus {
  if (meta.doneStages.includes(currentStage)) return "done";
  if (meta.activeStages.includes(currentStage)) return "active";
  if ("approvalStage" in meta && currentStage === meta.approvalStage) return "approval-needed";
  return "waiting";
}

export default function DebateSessionPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningStage, setRunningStage] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [level, setLevel] = useState<"초급" | "중급" | "고급">("중급");

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${id}`);
    const data = await res.json();
    setSession(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  // A3_RUNNING 동안 주기적으로 세션 폴링 (학생들 토론 진행 상황 업데이트)
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (session?.stage === "A3_RUNNING") {
      pollingRef.current = setInterval(fetchSession, 5000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [session?.stage, fetchSession]);

  async function runStage(opts?: Record<string, string>) {
    setRunningStage("running");
    setError("");
    try {
      const res = await fetch(`/api/sessions/${id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opts ?? {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setRunningStage("");
    }
  }

  async function approveStage(chosenProblem?: string) {
    setRunningStage("approving");
    setError("");
    try {
      const res = await fetch(`/api/sessions/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chosenProblem }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setRunningStage("");
    }
  }

  async function rerunA1() {
    setRunningStage("rerunning");
    setError("");
    try {
      const res = await fetch(`/api/sessions/${id}/rerun-a1`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setRunningStage("");
    }
  }

  async function finishA3() {
    setRunningStage("finishing");
    setError("");
    try {
      const res = await fetch(`/api/sessions/${id}/finish-a3`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setRunningStage("");
    }
  }

  if (loading) return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-lg">세션 불러오는 중...</div>
      </main>
      <Footer />
    </>
  );

  if (!session) return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-red-500">세션을 찾을 수 없습니다.</div>
      </main>
      <Footer />
    </>
  );

  const { stage, state } = session;
  const isRunning = !!runningStage;

  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] mb-1">
            🗣️ {session.topic}
          </h1>
          <div className="flex gap-2 text-sm text-gray-400">
            {session.grade && <span>{session.grade}</span>}
            {session.subject && <span>· {session.subject}</span>}
            <span className="ml-auto font-mono text-xs">{stage}</span>
          </div>
        </div>

        {["A3_READY", "A3_RUNNING", "A3_DONE", "A4_READY", "A4_DONE", "A5_READY", "A5_DONE_WAIT_APPROVAL", "A6_READY", "A6_DONE", "COMPLETED"].includes(stage) && (
          <OrchestratorPanel
            sessionId={id}
            stage={stage}
            chat={state.orchestratorChat ?? []}
            onActionsApplied={fetchSession}
          />
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        <div className="space-y-4">
          {STAGE_META.map((meta) => {
            const status = getStageStatus(meta, stage);
            const isOpen = expanded[meta.key] ?? (status === "active" || status === "approval-needed");

            return (
              <div key={meta.key} className={`rounded-2xl border-2 overflow-hidden transition-all ${
                status === "done" ? "border-green-200 bg-green-50/30" :
                (status === "active" || status === "approval-needed") ? "border-indigo-300 bg-indigo-50/30" :
                "border-gray-200 bg-white"
              }`}>
                <button
                  onClick={() => setExpanded((p) => ({ ...p, [meta.key]: !isOpen }))}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left"
                >
                  <span className="text-xl">{meta.icon}</span>
                  <span className="font-semibold text-[#1E293B] flex-1">{meta.label}</span>
                  <StatusBadge status={status} />
                  <span className="text-gray-300 ml-2">{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5">
                    <StageContent
                      stageKey={meta.key}
                      status={status}
                      state={state}
                      stage={stage}
                      isRunning={isRunning}
                      level={level}
                      setLevel={setLevel}
                      onRun={runStage}
                      onApprove={approveStage}
                      onRerunA1={rerunA1}
                      onFinishA3={finishA3}
                      sessionId={id}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatusBadge({ status }: { status: StageStatus }) {
  if (status === "done") return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">완료</span>;
  if (status === "active") return <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium animate-pulse">진행중</span>;
  if (status === "approval-needed") return <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">승인 필요</span>;
  return <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">대기</span>;
}

function StageContent({
  stageKey, status, state, stage, isRunning, level, setLevel,
  onRun, onApprove, onRerunA1, onFinishA3, sessionId,
}: {
  stageKey: string;
  status: StageStatus;
  state: DebateSessionState;
  stage: SessionStage;
  isRunning: boolean;
  level: "초급" | "중급" | "고급";
  setLevel: React.Dispatch<React.SetStateAction<"초급" | "중급" | "고급">>;
  onRun: (opts?: Record<string, string>) => void;
  onApprove: (chosenProblem?: string) => void;
  onRerunA1: () => void;
  onFinishA3: () => void;
  sessionId: string;
}) {
  if (status === "waiting") {
    return <p className="text-gray-400 text-sm">이전 단계가 완료되면 실행할 수 있습니다.</p>;
  }
  if (stageKey === "A1") return <A1Content status={status} state={state} stage={stage} isRunning={isRunning} onRun={onRun} onApprove={onApprove} onRerun={onRerunA1} />;
  if (stageKey === "A2") return <A2Content status={status} state={state} isRunning={isRunning} onRun={onRun} sessionId={sessionId} />;
  if (stageKey === "A3") return <A3Content status={status} state={state} stage={stage} isRunning={isRunning} level={level} setLevel={setLevel} onRun={onRun} onFinishA3={onFinishA3} sessionId={sessionId} />;
  if (stageKey === "A4") return <A4Content status={status} state={state} isRunning={isRunning} onRun={onRun} />;
  if (stageKey === "A5") return <A5Content status={status} state={state} isRunning={isRunning} onRun={onRun} onApprove={onApprove} />;
  if (stageKey === "A6") return <A6Content status={status} state={state} isRunning={isRunning} onRun={onRun} />;
  return null;
}

function RunButton({ onClick, isRunning, label = "▶ 실행", disabled }: { onClick: () => void; isRunning: boolean; label?: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={isRunning || disabled}
      className="mt-4 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold text-sm transition-colors flex items-center gap-2"
    >
      {isRunning ? <><span className="animate-spin">⏳</span> AI 생성 중...</> : label}
    </button>
  );
}

// ── A1 ──────────────────────────────────────────────────────────────────────
function A1Content({ status, state, stage, isRunning, onRun, onApprove, onRerun }: {
  status: StageStatus; state: DebateSessionState; stage: SessionStage; isRunning: boolean;
  onRun: (o?: Record<string, string>) => void; onApprove: (p?: string) => void; onRerun: () => void;
}) {
  const [chosen, setChosen] = useState(state.A1?.chosen ?? "");

  if (status === "active" && stage === "A1_READY") {
    return <RunButton onClick={() => onRun()} isRunning={isRunning} label="▶ 학습문제 3개 생성" />;
  }
  if (!state.A1?.problems?.length) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 font-medium">학습문제를 선택하고 승인하세요:</p>
      {state.A1.problems.map((p: Problem) => (
        <label key={p.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
          chosen === p.id ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-200"
        }`}>
          <input type="radio" name="problem" value={p.id} checked={chosen === p.id} onChange={() => setChosen(p.id)} className="mt-1" />
          <div>
            <p className="font-semibold text-[#1E293B]">{p.text}</p>
            <p className="text-sm text-gray-500 mt-1">{p.reason}</p>
            <span className="text-xs text-indigo-600 font-medium">적합도: {p.score}점</span>
          </div>
        </label>
      ))}
      {status === "approval-needed" && (
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => onApprove(chosen || state.A1?.problems[0]?.id)}
            disabled={isRunning || !chosen}
            className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold text-sm transition-colors"
          >
            ✔ 선택하고 승인
          </button>
          <button
            onClick={onRerun}
            disabled={isRunning}
            className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 text-gray-600 font-bold text-sm transition-colors"
          >
            🔄 다시 제안받기
          </button>
        </div>
      )}
    </div>
  );
}

// ── A2 ──────────────────────────────────────────────────────────────────────
function A2Content({ status, state, isRunning, onRun, sessionId }: {
  status: StageStatus; state: DebateSessionState; isRunning: boolean;
  onRun: (o?: Record<string, string>) => void; sessionId: string;
}) {
  const [showPlan, setShowPlan] = useState(true);

  if (status === "active") return <RunButton onClick={() => onRun()} isRunning={isRunning} label="▶ 지도안·평가지 생성" />;
  if (!state.A2) return null;

  return (
    <div className="space-y-4">
      <button onClick={() => setShowPlan(!showPlan)} className="text-sm text-indigo-600 hover:underline">
        {showPlan ? "▲ 지도안 접기" : "▼ 지도안 펼치기"}
      </button>
      {showPlan && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-x-auto max-h-[32rem] overflow-y-auto prose prose-sm max-w-none
          [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm
          [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold
          [&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top
          [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-3
          [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2
          [&_strong]:font-semibold [&_hr]:border-gray-200 [&_hr]:my-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {state.A2.lessonPlan}
          </ReactMarkdown>
        </div>
      )}
      <RubricEditor rubric={state.A2.rubric} sessionId={sessionId} />
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-2">이원목적분류표</p>
        <div className="bg-white border border-gray-200 rounded-xl p-4 overflow-x-auto
          prose prose-sm max-w-none
          [&_table]:border-collapse [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-sm
          [&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {state.A2.twoWayTable}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function RubricEditor({ rubric, sessionId }: { rubric: RubricSchema; sessionId: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rubric.criteria);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 외부에서 rubric이 바뀌면(예: A2 재실행) draft 동기화
  useEffect(() => {
    if (!editing) setDraft(rubric.criteria);
  }, [rubric.criteria, editing]);

  function update(id: string, field: "name" | "descriptor", value: string) {
    setDraft((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/rubric`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criteria: draft.map((c) => ({ id: c.id, name: c.name, descriptor: c.descriptor })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(rubric.criteria);
    setEditing(false);
    setError("");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-600">루브릭 (평가기준)</p>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-indigo-600 hover:underline font-medium"
          >
            ✏️ 편집
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={cancel}
              disabled={saving}
              className="text-xs text-gray-500 hover:underline disabled:opacity-40"
            >
              취소
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="text-xs px-2 py-0.5 rounded bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:bg-gray-300"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        )}
      </div>
      {error && (
        <div className="mb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
          {error}
        </div>
      )}
      <div className="space-y-2">
        {draft.map((c) => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="flex justify-between items-center mb-1 gap-2">
              {editing ? (
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => update(c.id, "name", e.target.value)}
                  className="flex-1 px-2 py-1 rounded border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none text-sm font-semibold text-[#1E293B]"
                />
              ) : (
                <span className="font-semibold text-sm text-[#1E293B]">{c.name}</span>
              )}
              <span className="text-xs text-gray-400 shrink-0">{c.max}점</span>
            </div>
            {editing ? (
              <textarea
                value={c.descriptor}
                onChange={(e) => update(c.id, "descriptor", e.target.value)}
                rows={2}
                className="w-full px-2 py-1 rounded border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none text-xs text-gray-600 resize-y"
              />
            ) : (
              <p className="text-xs text-gray-500">{c.descriptor}</p>
            )}
          </div>
        ))}
      </div>
      {editing && (
        <p className="mt-2 text-[11px] text-gray-400">
          * 항목 이름과 설명만 편집할 수 있습니다. 점수 배점(각 20점)과 항목 개수는 고정입니다.
        </p>
      )}
    </div>
  );
}

// ── A3 ──────────────────────────────────────────────────────────────────────
function A3Content({ status, state, stage, isRunning, level, setLevel, onRun, onFinishA3, sessionId }: {
  status: StageStatus; state: DebateSessionState; stage: SessionStage; isRunning: boolean;
  level: "초급" | "중급" | "고급";
  setLevel: React.Dispatch<React.SetStateAction<"초급" | "중급" | "고급">>;
  onRun: (o?: Record<string, string>) => void;
  onFinishA3: () => void;
  sessionId: string;
}) {
  const showConfig = status === "active" && (stage === "A2_DONE" || stage === "A3_READY");
  const threads = state.A3?.threads ?? [];
  const finishedCount = threads.filter((t) => t.status === "finished").length;
  const minTurnsOk = threads.every((t) => t.turns.length >= MIN_TURNS_TO_FINISH || t.status === "finished");

  if (showConfig) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">토론 수준</label>
          <div className="grid grid-cols-3 gap-2">
            {(["초급", "중급", "고급"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`py-3 rounded-xl border-2 font-semibold transition-colors ${
                  level === l
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 hover:border-indigo-300 text-gray-600"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            시작하면 학생 5명용 QR 코드가 생성됩니다. 학생은 QR 스캔 후 찬성/반대 입장을 선택합니다.
          </p>
        </div>
        <RunButton
          onClick={() => onRun({ level })}
          isRunning={isRunning}
          label="▶ 토론방 5개 만들기 (QR 생성)"
        />
      </div>
    );
  }

  if (stage === "A3_RUNNING" || (status === "done" && threads.length > 0)) {
    return (
      <div className="space-y-4">
        <ThreadDashboard sessionId={sessionId} threads={threads} />
        {stage === "A3_RUNNING" && (
          <div className="pt-3 border-t border-gray-200 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm text-gray-600">
              종료된 학생: <strong className="text-[#1E293B]">{finishedCount} / {threads.length}</strong>
              {!minTurnsOk && (
                <span className="ml-2 text-xs text-amber-600">
                  (일부 학생 최소 {MIN_TURNS_TO_FINISH / 2}턴 미달)
                </span>
              )}
            </div>
            <button
              onClick={onFinishA3}
              disabled={isRunning || finishedCount === 0}
              className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold text-sm transition-colors"
              title={finishedCount === 0 ? "최소 1명이 토론을 종료해야 다음 단계로 넘어갈 수 있습니다." : ""}
            >
              ✔ 토론 종료하고 분석 단계로
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ── per-student tab helper ────────────────────────────────────────────────
function StudentTabs({ threads, selected, onSelect }: {
  threads: DebateThread[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap mb-4 border-b border-gray-200 pb-2">
      {threads.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selected === t.id
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          #{t.index + 1} {t.studentLabel ?? `학생${t.index + 1}`}
        </button>
      ))}
    </div>
  );
}

// ── A4 ──────────────────────────────────────────────────────────────────────
function A4Content({ status, state, isRunning, onRun }: {
  status: StageStatus; state: DebateSessionState; isRunning: boolean; onRun: (o?: Record<string, string>) => void;
}) {
  const threads = state.A3?.threads ?? [];
  const [selected, setSelected] = useState<string | null>(threads[0]?.id ?? null);

  if (status === "active") return <RunButton onClick={() => onRun()} isRunning={isRunning} label="▶ 관찰 분석 실행 (5명)" />;
  if (!state.A4?.perStudent?.length) return null;

  const current = selected ?? threads[0]?.id;
  const obs = state.A4.perStudent.find((o) => o.threadId === current);
  if (!obs) return null;
  const keys: Array<[string, string]> = [["logical", "논리성"], ["evidence", "근거타당성"], ["rebuttal", "반박력"], ["understanding", "이해도"], ["attitude", "태도·구조"]];

  return (
    <div>
      <StudentTabs threads={threads} selected={current ?? null} onSelect={setSelected} />
      <div className="space-y-2">
        {keys.map(([k, label]) => (
          <div key={k} className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-20 shrink-0">{label}</span>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${(obs[k as keyof typeof obs] as number / 20) * 100}%` }} />
            </div>
            <span className="text-sm font-semibold text-indigo-700 w-12 text-right">{obs[k as keyof typeof obs] as number}/20</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── A5 ──────────────────────────────────────────────────────────────────────
function A5Content({ status, state, isRunning, onRun, onApprove }: {
  status: StageStatus; state: DebateSessionState; isRunning: boolean;
  onRun: (o?: Record<string, string>) => void; onApprove: (p?: string) => void;
}) {
  const threads = state.A3?.threads ?? [];
  const [selected, setSelected] = useState<string | null>(threads[0]?.id ?? null);

  if (status === "active") return <RunButton onClick={() => onRun()} isRunning={isRunning} label="▶ 평가 판정 실행 (5명)" />;
  if (!state.A5?.perStudent?.length) return null;

  const current = selected ?? threads[0]?.id;
  const a5 = state.A5.perStudent.find((o) => o.threadId === current);
  if (!a5) return null;
  const gradeColor = { "상": "text-green-600", "중": "text-indigo-600", "하": "text-orange-600" }[a5.grade] ?? "text-gray-600";

  return (
    <div>
      <StudentTabs threads={threads} selected={current ?? null} onSelect={setSelected} />
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className={`text-4xl font-black ${gradeColor}`}>{a5.grade}</div>
          <div>
            <p className="text-sm text-gray-500">총점</p>
            <p className="text-2xl font-bold text-[#1E293B]">{a5.totalScore}/100</p>
          </div>
        </div>
        {a5.evidence?.overall && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600 leading-relaxed">
            {a5.evidence.overall}
          </div>
        )}
      </div>
      {status === "approval-needed" && (
        <button
          onClick={() => onApprove()}
          disabled={isRunning}
          className="mt-4 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold text-sm transition-colors"
        >
          ✔ 확인하고 생기부 작성
        </button>
      )}
    </div>
  );
}

// ── A6 ──────────────────────────────────────────────────────────────────────
function A6Content({ status, state, isRunning, onRun }: {
  status: StageStatus; state: DebateSessionState; isRunning: boolean; onRun: (o?: Record<string, string>) => void;
}) {
  const threads = state.A3?.threads ?? [];
  const [selected, setSelected] = useState<string | null>(threads[0]?.id ?? null);

  if (status === "active") return <RunButton onClick={() => onRun()} isRunning={isRunning} label="▶ 생기부 초안 작성 (5명)" />;
  if (!state.A6?.perStudent?.length) return null;

  const current = selected ?? threads[0]?.id;
  const a6 = state.A6.perStudent.find((o) => o.threadId === current);
  const thread = threads.find((t) => t.id === current);
  if (!a6) return null;

  return (
    <div>
      <StudentTabs threads={threads} selected={current ?? null} onSelect={setSelected} />
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-2">누가기록</p>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-[#1E293B] leading-relaxed">
            {a6.cumulative}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-2">교과학습발달상황</p>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-[#1E293B] leading-relaxed">
            {a6.subjectDev}
          </div>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(
            `[${thread?.studentLabel ?? `학생${(thread?.index ?? 0) + 1}`}]\n\n[누가기록]\n${a6.cumulative}\n\n[교과학습발달상황]\n${a6.subjectDev}`
          )}
          className="px-4 py-2 rounded-xl border-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-sm font-medium transition-colors"
        >
          📋 이 학생 복사
        </button>
      </div>
    </div>
  );
}
