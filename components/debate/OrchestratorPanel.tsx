"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OrchestratorAction, OrchestratorMessage, SessionStage } from "@/lib/types/session";

interface StatusResult {
  overall: string;
  nextAction: string;
  perThread: Array<{ threadId: string; level: "info" | "warn" | "success"; msg: string }>;
}

interface Props {
  sessionId: string;
  stage: SessionStage;
  chat: OrchestratorMessage[];
  onActionsApplied: () => void;
}

const ACTION_LABELS: Record<OrchestratorAction["type"], string> = {
  finishThreads: "토론 종료",
  restartThreads: "토론 재시작",
  addNote: "메모 추가",
  setGrade: "평가 지정",
};

export default function OrchestratorPanel({ sessionId, stage, chat, onActionsApplied }: Props) {
  const [status, setStatus] = useState<StatusResult | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusAt, setStatusAt] = useState<Date | null>(null);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/orchestrator`);
      const json = (await res.json()) as StatusResult;
      setStatus(json);
      setStatusAt(new Date());
    } catch {
      // silent
    } finally {
      setStatusLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchStatus();
    if (stage === "A3_RUNNING") {
      const timer = setInterval(fetchStatus, 15000);
      return () => clearInterval(timer);
    }
  }, [stage, fetchStatus]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.length]);

  async function sendMessage() {
    if (!input.trim() || sending) return;
    setSending(true);
    setChatError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/orchestrator/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setInput("");
      onActionsApplied(); // 부모가 세션 새로고침
      fetchStatus(); // 상태 요약도 갱신
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0">🧭</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-bold text-indigo-700">AI 오케스트레이터</p>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              {statusAt && <span>{statusAt.toLocaleTimeString()}</span>}
              <button
                onClick={fetchStatus}
                disabled={statusLoading}
                className="text-indigo-600 hover:underline disabled:opacity-50"
              >
                {statusLoading ? "분석 중..." : "상태 새로고침"}
              </button>
            </div>
          </div>

          {status && (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-[#1E293B] leading-relaxed">{status.overall}</p>
              {status.nextAction && (
                <p className="text-xs text-gray-600">
                  <span className="font-semibold text-indigo-700">💡 다음 행동:</span> {status.nextAction}
                </p>
              )}
              {status.perThread.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {status.perThread.map((p) => (
                    <li key={p.threadId} className="flex items-start gap-2 text-xs">
                      <span className={`inline-block px-1.5 py-0.5 rounded-full font-bold text-[10px] shrink-0 ${
                        p.level === "warn" ? "bg-amber-100 text-amber-700" :
                        p.level === "success" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {p.level === "warn" ? "주의" : p.level === "success" ? "우수" : "알림"}
                      </span>
                      <span className="text-gray-700">{p.msg}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-indigo-100">
            <p className="text-xs font-semibold text-indigo-700 mb-2">💬 오케스트레이터에게 명령/피드백</p>
            <div
              ref={chatScrollRef}
              className="max-h-64 overflow-y-auto space-y-2 mb-3 pr-1"
            >
              {chat.length === 0 && (
                <p className="text-xs text-gray-400 italic">
                  예: &ldquo;3,4번 토론 종료해줘&rdquo; / &ldquo;2번 결과 상이었어, 태도 좋음&rdquo;
                </p>
              )}
              {chat.map((m, i) => (
                <div key={i} className={`flex ${m.role === "teacher" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                    m.role === "teacher"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white border border-indigo-200 text-[#1E293B] rounded-bl-sm"
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    {m.role === "ai" && m.actions && m.actions.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {m.actions.map((a, j) => (
                          <span key={j} className="inline-block px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                            {ACTION_LABELS[a.type]} · {a.indices.join(",")}번
                            {a.type === "setGrade" && ` → ${a.grade}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {chatError && (
              <div className="mb-2 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                {chatError}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } }}
                placeholder="예: 3번, 4번 토론 종료해줘"
                disabled={sending}
                className="flex-1 px-3 py-2 rounded-lg border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none text-sm bg-white disabled:bg-gray-50"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-bold transition-colors"
              >
                {sending ? "..." : "전송"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
