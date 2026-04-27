"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DebateChatPanel from "@/components/debate/DebateChatPanel";
import type { DebateSessionState, SessionStage } from "@/lib/types/session";

interface SessionData {
  id: string;
  topic: string;
  grade?: string;
  subject?: string;
  stage: SessionStage;
  state: DebateSessionState;
}

export default function DebateSessionPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${id}`);
    const data = await res.json();
    setSession(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (session?.stage === "A3_RUNNING") {
      pollingRef.current = setInterval(fetchSession, 5000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [session?.stage, fetchSession]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 text-lg">세션 불러오는 중...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-red-500">세션을 찾을 수 없습니다.</div>
        </main>
        <Footer />
      </>
    );
  }

  const hasTopic = !!session.state.meta?.topic;

  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col">
        <div className="mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-[#1E293B]">
            🗣️ {hasTopic ? session.state.meta.topic : "AI 토론 수업 설계"}
          </h1>
          <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
            {session.state.meta?.grade && <span>{session.state.meta.grade}</span>}
            {session.state.meta?.subject && <span>· {session.state.meta.subject}</span>}
            <span className="ml-auto font-mono">{session.stage}</span>
          </div>
        </div>

        <DebateChatPanel
          sessionId={id}
          state={session.state}
          stage={session.stage}
          onUpdate={fetchSession}
        />
      </main>
      <Footer />
    </>
  );
}
