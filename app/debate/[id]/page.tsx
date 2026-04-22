"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DebateChat from "@/components/debate/DebateChat";
import type { DebateSessionState, SessionStage, Turn, Problem } from "@/lib/types/session";

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
  { key: "A1", label: "① 학습문제 제안", icon: "📋", readyStage: "A1_READY", doneStages: ["A2_READY", "A2_DONE", "A3_READY", "A3_RUNNING", "A3_DONE", "A4_READY", "A4_DONE", "A5_READY", "A5_DONE_WAIT_APPROVAL", "A6_READY", "A6_DONE", "COMPLETED"] },
  { key: "A2", label: "② 지도안·평가지", icon: "📝", readyStage: "A2_READY", doneStages: ["A2_DONE", "A3_READY", "A3_RUNNING", "A3_DONE", "A4_READY", "A4_DONE", "A5_READY", "A5_DONE_WAIT_APPROVAL", "A6_READY", "A6_DONE", "COMPLETED"] },
  { key: "A3", label: "③ 토론 시뮬레이션", icon: "💬", readyStage: "A3_READY", doneStages: ["A3_DONE", "A4_READY", "A4_DONE", "A5_READY", "A5_DONE_WAIT_APPROVAL", "A6_READY", "A6_DONE", "COMPLETED"] },
  { key: "A4", label: "④ 과정 관찰", icon: "🔍", readyStage: "A4_READY", doneStages: ["A4_DONE", "A5_READY", "A5_DONE_WAIT_APPROVAL", "A6_READY", "A6_DONE", "COMPLETED"] },
  { key: "A5", label: "⑤ 평가 판정", icon: "📊", readyStage: "A5_READY", doneStages: ["A6_READY", "A6_DONE", "COMPLETED"] },
  { key: "A6", label: "⑥ 생기부 초안", icon: "📄", readyStage: "A6_READY", doneStages: ["A6_DONE", "COMPLETED"] },
];

function getStageStatus(meta: typeof STAGE_META[0], currentStage: SessionStage): StageStatus {
  if (meta.doneStages.includes(currentStage)) return "done";
  if (currentStage === meta.readyStage || currentStage === `${meta.key}_RUNNING`) return "active";
  if (currentStage === `${meta.key}_DONE_WAIT_APPROVAL`) return "approval-needed";
  return "waiting";
}

export default function DebateSessionPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningStage, setRunningStage] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [debateConfig, setDebateConfig] = useState({ level: "중급", studentPosition: "찬성" as "찬성" | "반대" });

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${id}`);
    const data = await res.json();
    setSession(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  async function runStage(opts?: { chosenProblem?: string; level?: string; studentPosition?: string }) {
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

  function handleTurnAdded(studentTurn: Turn, botTurn: Turn) {
    setSession((prev) => {
      if (!prev) return prev;
      const prevTurns = prev.state.A3?.turns ?? [];
      return {
        ...prev,
        state: {
          ...prev.state,
          A3: { ...prev.state.A3!, turns: [...prevTurns, studentTurn, botTurn] },
        },
      };
    });
  }

  async function finishDebate() {
    setRunningStage("finishing");
    setError("");
    try {
      const res = await fetch(`/api/sessions/${id}/finish-debate`, { method: "POST" });
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
                      debateConfig={debateConfig}
                      setDebateConfig={setDebateConfig}
                      onRun={runStage}
                      onApprove={approveStage}
                      onTurnAdded={handleTurnAdded}
                      onFinishDebate={finishDebate}
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
  stageKey, status, state, stage, isRunning, debateConfig, setDebateConfig,
  onRun, onApprove, onTurnAdded, onFinishDebate, sessionId,
}: {
  stageKey: string;
  status: StageStatus;
  state: DebateSessionState;
  stage: SessionStage;
  isRunning: boolean;
  debateConfig: { level: string; studentPosition: "찬성" | "반대" };
  setDebateConfig: React.Dispatch<React.SetStateAction<{ level: string; studentPosition: "찬성" | "반대" }>>;
  onRun: (opts?: Record<string, string>) => void;
  onApprove: (chosenProblem?: string) => void;
  onTurnAdded: (s: Turn, b: Turn) => void;
  onFinishDebate: () => void;
  sessionId: string;
}) {
  if (status === "waiting") {
    return <p className="text-gray-400 text-sm">이전 단계가 완료되면 실행할 수 있습니다.</p>;
  }

  if (stageKey === "A1") return <A1Content status={status} state={state} stage={stage} isRunning={isRunning} onRun={onRun} onApprove={onApprove} />;
  if (stageKey === "A2") return <A2Content status={status} state={state} isRunning={isRunning} onRun={onRun} />;
  if (stageKey === "A3") return <A3Content status={status} state={state} stage={stage} isRunning={isRunning} debateConfig={debateConfig} setDebateConfig={setDebateConfig} onRun={onRun} onTurnAdded={onTurnAdded} onFinishDebate={onFinishDebate} sessionId={sessionId} />;
  if (stageKey === "A4") return <A4Content status={status} state={state} isRunning={isRunning} onRun={onRun} />;
  if (stageKey === "A5") return <A5Content status={status} state={state} isRunning={isRunning} onRun={onRun} onApprove={onApprove} />;
  if (stageKey === "A6") return <A6Content status={status} state={state} isRunning={isRunning} onRun={onRun} />;
  return null;
}

function RunButton({ onClick, isRunning, label = "▶ 실행" }: { onClick: () => void; isRunning: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={isRunning}
      className="mt-4 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold text-sm transition-colors flex items-center gap-2"
    >
      {isRunning ? <><span className="animate-spin">⏳</span> AI 생성 중...</> : label}
    </button>
  );
}

function A1Content({ status, state, stage, isRunning, onRun, onApprove }: {
  status: StageStatus; state: DebateSessionState; stage: SessionStage; isRunning: boolean;
  onRun: (o?: Record<string, string>) => void; onApprove: (p?: string) => void;
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
        <button
          onClick={() => onApprove(chosen || state.A1?.problems[0]?.id)}
          disabled={isRunning}
          className="mt-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold text-sm transition-colors"
        >
          ✔ 선택하고 승인
        </button>
      )}
    </div>
  );
}

function A2Content({ status, state, isRunning, onRun }: {
  status: StageStatus; state: DebateSessionState; isRunning: boolean; onRun: (o?: Record<string, string>) => void;
}) {
  const [showPlan, setShowPlan] = useState(false);

  if (status === "active") {
    return <RunButton onClick={() => onRun()} isRunning={isRunning} label="▶ 지도안·평가지 생성" />;
  }
  if (!state.A2) return null;

  return (
    <div className="space-y-4">
      <button onClick={() => setShowPlan(!showPlan)} className="text-sm text-indigo-600 hover:underline">
        {showPlan ? "▲ 지도안 접기" : "▼ 지도안 펼치기"}
      </button>
      {showPlan && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-[#1E293B] whitespace-pre-wrap font-mono overflow-x-auto max-h-80 overflow-y-auto">
          {state.A2.lessonPlan}
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-2">루브릭 (평가기준)</p>
        <div className="space-y-2">
          {state.A2.rubric?.criteria?.map((c) => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm text-[#1E293B]">{c.name}</span>
                <span className="text-xs text-gray-400">{c.max}점</span>
              </div>
              <p className="text-xs text-gray-500">{c.descriptor}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-2">이원목적분류표</p>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-xs overflow-x-auto whitespace-pre-wrap">
          {state.A2.twoWayTable}
        </div>
      </div>
    </div>
  );
}

function A3Content({ status, state, stage, isRunning, debateConfig, setDebateConfig, onRun, onTurnAdded, onFinishDebate, sessionId }: {
  status: StageStatus; state: DebateSessionState; stage: SessionStage; isRunning: boolean;
  debateConfig: { level: string; studentPosition: "찬성" | "반대" };
  setDebateConfig: React.Dispatch<React.SetStateAction<{ level: string; studentPosition: "찬성" | "반대" }>>;
  onRun: (o?: Record<string, string>) => void; onTurnAdded: (s: Turn, b: Turn) => void;
  onFinishDebate: () => void; sessionId: string;
}) {
  if (status === "active" && stage === "A3_READY") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">토론 수준</label>
            <select
              value={debateConfig.level}
              onChange={(e) => setDebateConfig((p) => ({ ...p, level: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-sm bg-white"
            >
              {["초급", "중급", "고급"].map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">학생 입장</label>
            <select
              value={debateConfig.studentPosition}
              onChange={(e) => setDebateConfig((p) => ({ ...p, studentPosition: e.target.value as "찬성" | "반대" }))}
              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-sm bg-white"
            >
              <option>찬성</option>
              <option>반대</option>
            </select>
          </div>
        </div>
        <RunButton onClick={() => onRun({ level: debateConfig.level, studentPosition: debateConfig.studentPosition })} isRunning={isRunning} label="▶ 토론 시작" />
      </div>
    );
  }

  if (stage === "A3_RUNNING" || (status === "done" && state.A3?.turns?.length)) {
    return (
      <DebateChat
        sessionId={sessionId}
        turns={state.A3?.turns ?? []}
        studentPosition={state.A3?.studentPosition ?? "찬성"}
        onTurnAdded={onTurnAdded}
        onFinish={onFinishDebate}
      />
    );
  }

  if (status === "done") return <p className="text-sm text-green-600">토론이 완료되었습니다. ({state.A3?.turns?.length ?? 0}턴)</p>;
  return null;
}

function A4Content({ status, state, isRunning, onRun }: {
  status: StageStatus; state: DebateSessionState; isRunning: boolean; onRun: (o?: Record<string, string>) => void;
}) {
  if (status === "active") return <RunButton onClick={() => onRun()} isRunning={isRunning} label="▶ 관찰 분석 실행" />;
  if (!state.A4?.perStudent?.[0]) return null;
  const obs = state.A4.perStudent[0];
  const keys: Array<[string, string]> = [["logical", "논리성"], ["evidence", "근거타당성"], ["rebuttal", "반박력"], ["understanding", "이해도"], ["attitude", "태도·구조"]];
  return (
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
  );
}

function A5Content({ status, state, isRunning, onRun, onApprove }: {
  status: StageStatus; state: DebateSessionState; isRunning: boolean;
  onRun: (o?: Record<string, string>) => void; onApprove: (p?: string) => void;
}) {
  if (status === "active") return <RunButton onClick={() => onRun()} isRunning={isRunning} label="▶ 평가 판정 실행" />;
  if (!state.A5) return null;
  const gradeColor = { "상": "text-green-600", "중": "text-indigo-600", "하": "text-orange-600" }[state.A5.grade] ?? "text-gray-600";
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className={`text-4xl font-black ${gradeColor}`}>{state.A5.grade}</div>
        <div>
          <p className="text-sm text-gray-500">총점</p>
          <p className="text-2xl font-bold text-[#1E293B]">{state.A5.totalScore}/100</p>
        </div>
      </div>
      {state.A5.evidence?.overall && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600 leading-relaxed">
          {state.A5.evidence.overall}
        </div>
      )}
      {status === "approval-needed" && (
        <button
          onClick={() => onApprove()}
          disabled={isRunning}
          className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold text-sm transition-colors"
        >
          ✔ 확인하고 생기부 작성
        </button>
      )}
    </div>
  );
}

function A6Content({ status, state, isRunning, onRun }: {
  status: StageStatus; state: DebateSessionState; isRunning: boolean; onRun: (o?: Record<string, string>) => void;
}) {
  if (status === "active") return <RunButton onClick={() => onRun()} isRunning={isRunning} label="▶ 생기부 초안 작성" />;
  if (!state.A6) return null;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-2">누가기록</p>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-[#1E293B] leading-relaxed">
          {state.A6.cumulative}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-2">교과학습발달상황</p>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-[#1E293B] leading-relaxed">
          {state.A6.subjectDev}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => navigator.clipboard.writeText(`[누가기록]\n${state.A6!.cumulative}\n\n[교과학습발달상황]\n${state.A6!.subjectDev}`)}
          className="px-4 py-2 rounded-xl border-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-sm font-medium transition-colors"
        >
          📋 복사
        </button>
      </div>
    </div>
  );
}
