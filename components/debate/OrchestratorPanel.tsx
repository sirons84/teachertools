"use client";

import { useCallback, useEffect, useState } from "react";
import type { SessionStage } from "@/lib/types/session";

interface OrchestratorResult {
  overall: string;
  nextAction: string;
  perThread: Array<{ threadId: string; level: "info" | "warn" | "success"; msg: string }>;
}

interface Props {
  sessionId: string;
  stage: SessionStage;
}

export default function OrchestratorPanel({ sessionId, stage }: Props) {
  const [data, setData] = useState<OrchestratorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/orchestrator`);
      const json = (await res.json()) as OrchestratorResult;
      setData(json);
      setUpdatedAt(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchData();
    // A3_RUNNING 동안만 주기 갱신 (15초)
    if (stage === "A3_RUNNING") {
      const timer = setInterval(fetchData, 15000);
      return () => clearInterval(timer);
    }
  }, [stage, fetchData]);

  return (
    <div className="mb-6 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0">🧭</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-bold text-indigo-700">AI 오케스트레이터</p>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              {updatedAt && <span>{updatedAt.toLocaleTimeString()}</span>}
              <button
                onClick={fetchData}
                disabled={loading}
                className="text-indigo-600 hover:underline disabled:opacity-50"
              >
                {loading ? "분석 중..." : "새로고침"}
              </button>
            </div>
          </div>
          {!data && loading && (
            <p className="mt-2 text-sm text-gray-400">현재 상태 분석 중...</p>
          )}
          {data && (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-[#1E293B] leading-relaxed">{data.overall}</p>
              {data.nextAction && (
                <p className="text-xs text-gray-600">
                  <span className="font-semibold text-indigo-700">💡 다음 행동:</span> {data.nextAction}
                </p>
              )}
              {data.perThread.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {data.perThread.map((p) => (
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
        </div>
      </div>
    </div>
  );
}
