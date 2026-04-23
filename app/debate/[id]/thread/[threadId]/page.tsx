"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DebateChat from "@/components/debate/DebateChat";
import type { DebateThread, Turn } from "@/lib/types/session";

interface ThreadData {
  sessionId: string;
  topic: string;
  grade?: string;
  subject?: string;
  learningProblem: string | null;
  level: "초급" | "중급" | "고급";
  thread: DebateThread;
}

export default function StudentThreadPage() {
  const { id, threadId } = useParams<{ id: string; threadId: string }>();
  const [data, setData] = useState<ThreadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinLabel, setJoinLabel] = useState("");
  const [joinPosition, setJoinPosition] = useState<"찬성" | "반대" | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/sessions/${id}/threads/${threadId}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "쓰레드를 불러올 수 없습니다.");
      setLoading(false);
      return;
    }
    setData(json);
    setLoading(false);
  }, [id, threadId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleJoin() {
    if (!joinPosition) { setError("입장을 선택해주세요."); return; }
    setJoining(true);
    setError("");
    try {
      const res = await fetch(`/api/sessions/${id}/threads/${threadId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: joinPosition, studentLabel: joinLabel.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "참가 중 오류가 발생했습니다.");
    } finally {
      setJoining(false);
    }
  }

  function handleTurnAdded(studentTurn: Turn, botTurn: Turn) {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        thread: { ...prev.thread, turns: [...prev.thread.turns, studentTurn, botTurn] },
      };
    });
  }

  async function handleFinish() {
    try {
      const res = await fetch(`/api/sessions/${id}/threads/${threadId}/finish`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "종료 중 오류가 발생했습니다.");
    }
  }

  async function handleRestart() {
    if (!confirm("현재 토론을 지우고 새로 시작할까요? 이전 대화는 교사 기록에 남습니다.")) return;
    try {
      const res = await fetch(`/api/sessions/${id}/threads/${threadId}/restart`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "재시작 중 오류가 발생했습니다.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">불러오는 중...</div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white border border-red-200 rounded-2xl p-6 max-w-md text-center">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const { thread, topic, learningProblem, level } = data;
  const needsJoin = !thread.position;
  const isFinished = thread.status === "finished";

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-5">
          <p className="text-xs text-gray-400 mb-1">AI 토론 · 난이도 {level}</p>
          <h1 className="text-lg sm:text-xl font-bold text-[#1E293B] leading-snug">{topic}</h1>
          {learningProblem && (
            <p className="mt-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl p-3">
              <span className="font-semibold">학습문제 · </span>{learningProblem}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        {needsJoin ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div>
              <h2 className="font-bold text-[#1E293B] mb-1">토론 참가</h2>
              <p className="text-sm text-gray-500">이름과 입장을 선택하고 시작하세요.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1E293B] mb-1">이름 (선택)</label>
              <input
                type="text"
                value={joinLabel}
                onChange={(e) => setJoinLabel(e.target.value)}
                placeholder="예: 김민수 / 3번"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-sm"
                disabled={joining}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1E293B] mb-2">내 입장</label>
              <div className="grid grid-cols-2 gap-3">
                {(["찬성", "반대"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setJoinPosition(p)}
                    disabled={joining}
                    className={`py-4 rounded-xl border-2 font-bold transition-colors ${
                      joinPosition === p
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 hover:border-indigo-300 text-gray-600"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleJoin}
              disabled={joining || !joinPosition}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold transition-colors"
            >
              {joining ? "참가 중..." : "토론 시작하기 →"}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            {thread.studentLabel && (
              <p className="text-xs text-gray-400 mb-3">
                {thread.studentLabel} · {thread.position} 입장
                {isFinished && <span className="ml-2 px-2 py-0.5 rounded-full bg-green-100 text-green-700">종료됨</span>}
              </p>
            )}
            <DebateChat
              sessionId={id}
              threadId={threadId}
              turns={thread.turns}
              studentPosition={thread.position!}
              disabled={isFinished}
              onTurnAdded={handleTurnAdded}
              onFinish={isFinished ? undefined : handleFinish}
              onRestart={handleRestart}
            />
          </div>
        )}
      </div>
    </main>
  );
}
