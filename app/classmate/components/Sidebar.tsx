"use client";

import Image from "next/image";
import Link from "next/link";
import { useApp } from "../AppContext";
import AgentList from "./AgentList";
import ConversationHistory from "./ConversationHistory";

export default function Sidebar() {
  const { startNewConversation } = useApp();

  return (
    <aside className="w-[260px] shrink-0 h-screen flex flex-col bg-white/70 backdrop-blur-xl border-r border-slate-200/60">
      <div className="px-5 py-5">
        <Link
          href="/classmate"
          className="flex items-center gap-2 rounded-lg -mx-1 px-1 py-1 hover:bg-slate-100/60 transition"
        >
          <Image
            src="/robo.png"
            alt="미래교육창작소"
            width={28}
            height={28}
            className="rounded-md"
            priority
          />
          <span className="font-bold text-[1.35rem] leading-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            미래교육창작소
          </span>
        </Link>
      </div>

      <div className="px-3">
        <button
          onClick={startNewConversation}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition flex items-center gap-2"
        >
          <span className="text-lg leading-none">＋</span>
          <span>새 대화</span>
        </button>
      </div>

      <div className="mt-5 px-3">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
          AI 친구 선택
        </div>
        <AgentList />
      </div>

      <div className="mt-5 mx-3 border-t border-slate-200/80" />

      <div className="flex-1 min-h-0 mt-3 px-3 pb-4 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
          최근 대화
        </div>
        <ConversationHistory />
      </div>
    </aside>
  );
}
