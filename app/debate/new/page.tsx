"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const GRADES = ["초1", "초2", "초3", "초4", "초5", "초6", "중1", "중2", "중3", "고1", "고2", "고3"];
const SUBJECTS = ["국어", "사회", "도덕", "역사", "과학", "수학", "영어", "미술", "음악", "체육", "기타"];

export default function DebateNewPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) { setError("수업 주제를 입력해주세요."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, grade: grade || undefined, subject: subject || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/debate/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🗣️</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] mb-2">AI 토론 수업 설계</h1>
          <p className="text-gray-500 text-sm sm:text-base">
            주제 한 줄로 학습문제 → 지도안 → 토론 → 평가 → 생기부까지 자동 생성
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-2">
              수업 주제 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: 민주주의에서 다수결의 한계"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-[#1E293B] text-base transition-colors"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#1E293B] mb-2">학년</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-[#1E293B] bg-white transition-colors"
                disabled={loading}
              >
                <option value="">선택 안 함</option>
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1E293B] mb-2">교과</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:outline-none text-[#1E293B] bg-white transition-colors"
                disabled={loading}
              >
                <option value="">선택 안 함</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                세션 생성 중...
              </>
            ) : (
              <>
                시작하기 →
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <p className="text-sm text-indigo-700 text-center">
            <span className="font-bold">6단계 자동 생성:</span> 학습문제 → 지도안 → 토론 시뮬레이션 → 관찰 → 평가 → 생기부
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
