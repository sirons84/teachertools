"use client";

import { useState, useRef, useEffect } from "react";
import { MIN_TURNS_TO_FINISH, type Turn } from "@/lib/types/session";

interface DebateChatProps {
  sessionId: string;
  threadId: string;
  turns: Turn[];
  studentPosition: "찬성" | "반대";
  disabled?: boolean;
  onTurnAdded: (studentTurn: Turn, botTurn: Turn) => void;
  onFinish?: () => void;
  onRestart?: () => void;
}

const PHASES: Turn["phase"][] = ["입론", "반론", "최후변론"];

export default function DebateChat({
  sessionId, threadId, turns, studentPosition, disabled,
  onTurnAdded, onFinish, onRestart,
}: DebateChatProps) {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Turn["phase"]>("입론");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  async function handleSend() {
    if (!input.trim() || loading || disabled) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/threads/${threadId}/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim(), phase }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInput("");
      onTurnAdded(data.studentTurn, data.botTurn);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-gray-600">현재 단계:</span>
        {PHASES.map((p) => (
          <button
            key={p}
            onClick={() => setPhase(p)}
            disabled={disabled}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
              phase === p ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {p}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">내 입장: <strong>{studentPosition}</strong></span>
      </div>

      <div className="h-80 overflow-y-auto border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
        {turns.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            입론부터 시작하세요. 아래에 발언을 입력하면 AI가 반박합니다.
          </div>
        )}
        {turns.map((t) => (
          <div
            key={t.id}
            className={`flex ${t.speaker === "student" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                t.speaker === "student"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-white border border-gray-200 text-[#1E293B] rounded-bl-sm"
              }`}
            >
              <div className="text-xs mb-1 opacity-70">
                {t.speaker === "student" ? `나 (${t.side}) · ${t.phase}` : `AI (${t.side}) · ${t.phase}`}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{t.text}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>
      )}

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={disabled ? "종료된 토론입니다." : `[${phase}] 발언을 입력하세요... (Shift+Enter로 줄바꿈)`}
          className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-sm resize-none h-20 transition-colors disabled:bg-gray-100"
          disabled={loading || disabled}
        />
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSend}
            disabled={loading || disabled || !input.trim()}
            className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold text-sm transition-colors"
          >
            {loading ? "..." : "전송"}
          </button>
          {onFinish && (
            <button
              onClick={onFinish}
              disabled={loading || disabled || turns.length < MIN_TURNS_TO_FINISH}
              className="px-4 py-3 rounded-xl border-2 border-indigo-300 hover:bg-indigo-50 disabled:border-gray-200 disabled:text-gray-300 text-indigo-600 font-bold text-sm transition-colors"
              title={`최소 ${MIN_TURNS_TO_FINISH / 2}턴 이상 토론 후 종료 가능`}
            >
              종료
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>최소 {MIN_TURNS_TO_FINISH / 2}턴(학생 {MIN_TURNS_TO_FINISH / 2}회 이상) 진행 후 토론 종료 가능</span>
        {onRestart && turns.length > 0 && (
          <button
            onClick={onRestart}
            disabled={loading}
            className="text-gray-400 hover:text-red-500 underline disabled:opacity-50"
          >
            🔄 토론 새로 시작하기
          </button>
        )}
      </div>
    </div>
  );
}
