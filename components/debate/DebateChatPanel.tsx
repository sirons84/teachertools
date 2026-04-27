"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ThreadDashboard from "@/components/debate/ThreadDashboard";
import type {
  DebateSessionState,
  OrchestratorMessage,
  OrchestratorToolCall,
  Problem,
  SessionStage,
} from "@/lib/types/session";

interface Props {
  sessionId: string;
  state: DebateSessionState;
  stage: SessionStage;
  onUpdate: () => void;
}

const QUICK_CHIPS_BY_STAGE: Record<string, string[]> = {
  A1_READY: ["학습문제 만들어줘", "주제만 좀 더 다듬어줘"],
  A1_DONE_WAIT_APPROVAL: ["1번으로 진행", "다른 후보 다시 만들어줘"],
  A2_READY: ["수업안 만들어줘"],
  A2_DONE: ["중급 난이도로 토론 시작", "초급으로 시작", "고급으로 시작"],
  A3_RUNNING: ["전체 진행 상황 알려줘", "토론 마치고 분석 단계로"],
  A3_DONE: ["관찰 분석 진행"],
  A4_DONE: ["평가 진행"],
  A5_DONE_WAIT_APPROVAL: ["평가 승인하고 생기부 작성"],
  A6_READY: ["생기부 작성"],
  A6_DONE: ["완료"],
};

export default function DebateChatPanel({ sessionId, state, stage, onUpdate }: Props) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chat = state.orchestratorChat ?? [];
  const hasTopic = !!state.meta?.topic;
  const chips = QUICK_CHIPS_BY_STAGE[stage] ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.length]);

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/orchestrator/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setInput("");
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white border-2 border-indigo-100 rounded-2xl overflow-hidden min-h-[60vh]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
        {chat.length === 0 && (
          <WelcomeMessage hasTopic={hasTopic} state={state} />
        )}
        {chat.map((m, i) => (
          <ChatMessage
            key={i}
            message={m}
            state={state}
            sessionId={sessionId}
            onSend={send}
          />
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="animate-spin">⏳</span>
            <span>생각하고 있어요... (단계에 따라 30초~1분 걸릴 수 있어요)</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="border-t border-indigo-100 px-4 sm:px-6 py-3 bg-indigo-50/30">
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {chips.map((c) => (
              <button
                key={c}
                onClick={() => send(c)}
                disabled={sending}
                className="text-xs px-3 py-1.5 rounded-full border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={hasTopic ? "오케스트레이터에게 자연어로 말해보세요..." : "수업 주제를 입력해보세요. 예: 민주주의에서 다수결의 한계 (학년·교과도 함께)"}
            disabled={sending}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none text-sm bg-white disabled:bg-gray-50"
          />
          <button
            onClick={() => send(input)}
            disabled={sending || !input.trim()}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-bold transition-colors"
          >
            {sending ? "..." : "전송"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WelcomeMessage({ hasTopic, state }: { hasTopic: boolean; state: DebateSessionState }) {
  return (
    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0">🧭</div>
        <div className="text-sm text-[#1E293B] leading-relaxed">
          <p className="font-bold text-indigo-700 mb-1">AI 토론 수업 오케스트레이터</p>
          {!hasTopic ? (
            <p>
              안녕하세요! 어떤 주제로 토론 수업을 만드시나요? 학년·교과도 함께 알려주시면 더 잘 맞춰
              드릴 수 있어요. (예: <span className="text-indigo-700 font-medium">&ldquo;중2 사회, 다수결의 한계&rdquo;</span>)
            </p>
          ) : (
            <p>
              주제 <span className="font-semibold text-indigo-700">&ldquo;{state.meta.topic}&rdquo;</span>로
              시작할 준비가 됐어요. &ldquo;학습문제 만들어줘&rdquo; 같이 말해보세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatMessage({
  message,
  state,
  sessionId,
  onSend,
}: {
  message: OrchestratorMessage;
  state: DebateSessionState;
  sessionId: string;
  onSend: (text: string) => void;
}) {
  if (message.role === "teacher") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 bg-indigo-600 text-white text-sm whitespace-pre-wrap">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] flex-1">
        <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-gray-50 border border-gray-200 text-sm text-[#1E293B] whitespace-pre-wrap leading-relaxed">
          {message.text}
        </div>

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.toolCalls.map((tc, i) => (
              <ToolBadge key={i} call={tc} />
            ))}
          </div>
        )}

        {message.toolCalls?.map((tc, i) => (
          <ToolAttachment
            key={`att-${i}`}
            call={tc}
            state={state}
            sessionId={sessionId}
            onSend={onSend}
          />
        ))}

        {message.actions && message.actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.actions.map((a, i) => (
              <span
                key={i}
                className="inline-block px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-100"
              >
                {actionLabel(a.type)} · {a.indices.join(",")}번
                {a.type === "setGrade" && ` → ${a.grade}`}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolBadge({ call }: { call: OrchestratorToolCall }) {
  const ok = call.status === "ok";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
        ok
          ? "bg-green-50 text-green-700 border-green-100"
          : "bg-red-50 text-red-700 border-red-100"
      }`}
      title={call.summary}
    >
      <span>{ok ? "✓" : "✗"}</span>
      <span>{TOOL_LABELS[call.name] ?? call.name}</span>
    </span>
  );
}

const TOOL_LABELS: Record<string, string> = {
  set_topic: "주제 등록",
  discover_problems: "학습문제 생성",
  choose_problem: "학습문제 확정",
  design_lesson: "수업안 생성",
  start_debate: "토론 시작",
  get_status: "상태 조회",
  finish_threads: "토론 종료",
  restart_threads: "토론 재시작",
  add_note: "메모 추가",
  set_grade: "평가 지정",
  finish_debate_phase: "토론 단계 종료",
  observe_students: "관찰 분석",
  evaluate_students: "평가 판정",
  approve_evaluation: "평가 승인",
  generate_records: "생기부 작성",
};

function actionLabel(type: string): string {
  return (
    {
      finishThreads: "토론 종료",
      restartThreads: "토론 재시작",
      addNote: "메모 추가",
      setGrade: "평가 지정",
    }[type] ?? type
  );
}

function ToolAttachment({
  call,
  state,
  sessionId,
  onSend,
}: {
  call: OrchestratorToolCall;
  state: DebateSessionState;
  sessionId: string;
  onSend: (text: string) => void;
}) {
  if (call.status !== "ok") return null;
  const name = call.name;

  if (name === "discover_problems" && state.A1?.problems?.length) {
    return <ProblemsAttachment problems={state.A1.problems} chosen={state.A1.chosen} onSend={onSend} />;
  }
  if (name === "design_lesson" && state.A2) {
    return <LessonPlanAttachment a2={state.A2} />;
  }
  if (name === "start_debate" && state.A3?.threads?.length) {
    return (
      <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4">
        <ThreadDashboard sessionId={sessionId} threads={state.A3.threads} />
      </div>
    );
  }
  if (name === "get_status" && state.A3?.threads?.length) {
    return (
      <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4">
        <ThreadDashboard sessionId={sessionId} threads={state.A3.threads} />
      </div>
    );
  }
  if (name === "observe_students" && state.A4?.perStudent?.length) {
    return <ObservationsAttachment state={state} />;
  }
  if (name === "evaluate_students" && state.A5?.perStudent?.length) {
    return <EvaluationsAttachment state={state} />;
  }
  if (name === "generate_records" && state.A6?.perStudent?.length) {
    return <RecordsAttachment state={state} />;
  }
  return null;
}

function ProblemsAttachment({
  problems,
  chosen,
  onSend,
}: {
  problems: Problem[];
  chosen?: string;
  onSend: (text: string) => void;
}) {
  return (
    <div className="mt-3 space-y-2">
      {problems.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onSend(`${i + 1}번으로 진행해줘`)}
          disabled={!!chosen}
          className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
            chosen === p.id
              ? "border-indigo-400 bg-indigo-50"
              : "border-gray-200 bg-white hover:border-indigo-300 disabled:opacity-60 disabled:cursor-not-allowed"
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-indigo-600 shrink-0 mt-0.5">{i + 1}.</span>
            <div className="flex-1">
              <p className="font-semibold text-sm text-[#1E293B]">{p.text}</p>
              <p className="text-xs text-gray-500 mt-1">{p.reason}</p>
              <span className="text-[11px] text-indigo-600 font-medium">적합도 {p.score}점</span>
            </div>
            {chosen === p.id && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                선택됨
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function LessonPlanAttachment({ a2 }: { a2: NonNullable<DebateSessionState["A2"]> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 bg-white border border-gray-200 rounded-xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-[#1E293B]">📝 지도안·루브릭·이원목적분류표</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 mt-3">지도안</p>
            <div className="prose prose-sm max-w-none max-h-[24rem] overflow-y-auto
              [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm
              [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold
              [&_td]:border [&_td]:border-gray-200 [&_td]:px-2 [&_td]:py-1 [&_td]:align-top
              [&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-2
              [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{a2.lessonPlan}</ReactMarkdown>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">루브릭</p>
            <div className="space-y-1.5">
              {a2.rubric.criteria.map((c) => (
                <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-gray-400">{c.max}점</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5">{c.descriptor}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">이원목적분류표</p>
            <div className="prose prose-sm max-w-none
              [&_table]:border-collapse [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-xs
              [&_td]:border [&_td]:border-gray-200 [&_td]:px-2 [&_td]:py-1 [&_td]:text-xs">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{a2.twoWayTable}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ObservationsAttachment({ state }: { state: DebateSessionState }) {
  const threads = state.A3?.threads ?? [];
  const obs = state.A4?.perStudent ?? [];
  const labels: Array<[string, string]> = [
    ["logical", "논리성"],
    ["evidence", "근거"],
    ["rebuttal", "반박력"],
    ["understanding", "이해도"],
    ["attitude", "태도"],
  ];
  return (
    <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-[#1E293B] mb-3">🔍 관찰 결과</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {threads.map((t) => {
          const o = obs.find((x) => x.threadId === t.id);
          if (!o) return null;
          return (
            <div key={t.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50/40">
              <p className="text-xs font-bold text-[#1E293B] mb-2">{t.index + 1}번 {t.studentLabel ?? ""}</p>
              <div className="space-y-1">
                {labels.map(([k, name]) => {
                  const v = o[k as keyof typeof o] as number;
                  return (
                    <div key={k} className="flex items-center gap-2 text-[11px]">
                      <span className="w-12 text-gray-500">{name}</span>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-400"
                          style={{ width: `${(v / 20) * 100}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-indigo-700 font-semibold">{v}/20</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EvaluationsAttachment({ state }: { state: DebateSessionState }) {
  const threads = state.A3?.threads ?? [];
  const evals = state.A5?.perStudent ?? [];
  const gradeColor: Record<string, string> = { 상: "text-green-600", 중: "text-indigo-600", 하: "text-orange-600" };
  return (
    <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-[#1E293B] mb-3">📊 평가 결과</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {threads.map((t) => {
          const e = evals.find((x) => x.threadId === t.id);
          if (!e) return null;
          return (
            <div key={t.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#1E293B]">{t.index + 1}번 {t.studentLabel ?? ""}</span>
                <span className={`text-2xl font-black ${gradeColor[e.grade] ?? "text-gray-600"}`}>
                  {e.grade}
                </span>
              </div>
              <p className="text-xs text-gray-500">총점 {e.totalScore}/100</p>
              {e.evidence?.overall && (
                <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">{e.evidence.overall}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecordsAttachment({ state }: { state: DebateSessionState }) {
  const threads = state.A3?.threads ?? [];
  const records = state.A6?.perStudent ?? [];
  return (
    <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-[#1E293B] mb-3">📄 생기부 초안</p>
      <div className="space-y-3">
        {threads.map((t) => {
          const r = records.find((x) => x.threadId === t.id);
          if (!r) return null;
          const label = t.studentLabel ?? `학생${t.index + 1}`;
          return (
            <div key={t.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#1E293B]">{t.index + 1}번 {label}</span>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `[${label}]\n\n[누가기록]\n${r.cumulative}\n\n[교과학습발달상황]\n${r.subjectDev}`,
                    )
                  }
                  className="text-[11px] text-indigo-600 hover:underline"
                >
                  📋 복사
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 mb-0.5">누가기록</p>
                  <p className="text-[#1E293B] leading-relaxed">{r.cumulative}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 mb-0.5">교과학습발달상황</p>
                  <p className="text-[#1E293B] leading-relaxed">{r.subjectDev}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
