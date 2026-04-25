"use client";

import Image from "next/image";
import Link from "next/link";
import { useApp } from "../AppContext";
import AgentList from "./AgentList";
import ConversationHistory from "./ConversationHistory";

export default function Sidebar() {
  const { startNewConversation, sidebarOpen, setSidebarOpen } = useApp();

  const handleNewConversation = () => {
    startNewConversation();
    setSidebarOpen(false);
  };

  return (
    <>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-30 animate-fade-in"
          aria-hidden
        />
      )}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-[260px] shrink-0 h-screen flex flex-col
          bg-white/90 md:bg-white/70 backdrop-blur-xl border-r border-slate-200/60
          transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
      <div className="px-5 py-5 flex items-center justify-between">
        <Link
          href="/classmate"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-2 rounded-lg -mx-1 px-1 py-1 hover:bg-slate-100/60 transition"
        >
          <Image
            src="/robo.png"
            alt="미래교육창작소"
            width={20}
            height={20}
            className="rounded-md"
            priority
          />
          <span className="font-bold text-[1.35rem] leading-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            미래교육창작소
          </span>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 rounded"
          aria-label="메뉴 닫기"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="px-3">
        <button
          onClick={handleNewConversation}
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
    </>
  );
}
