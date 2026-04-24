"use client";

import { useApp } from "../AppContext";

export default function ChatHeader() {
  const { currentAgent, setSidebarOpen } = useApp();

  return (
    <header className="h-16 shrink-0 flex items-center gap-2 px-4 sm:px-6 border-b border-slate-200/60 bg-white/50 backdrop-blur-sm">
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition"
        aria-label="메뉴 열기"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {currentAgent ? (
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0">{currentAgent.icon}</span>
          <div className="flex items-baseline gap-3 min-w-0">
            <h1 className="font-semibold text-slate-800 truncate">{currentAgent.name}</h1>
            <span className="text-xs text-slate-400 hidden md:inline truncate">
              {currentAgent.desc}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-slate-400 text-sm truncate">AI 친구를 선택하면 대화를 시작할 수 있어요</div>
      )}
    </header>
  );
}
