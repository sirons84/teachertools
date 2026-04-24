"use client";

import { useApp } from "../AppContext";

export default function ChatHeader() {
  const { currentAgent } = useApp();

  return (
    <header className="h-16 shrink-0 flex items-center px-6 border-b border-slate-200/60 bg-white/50 backdrop-blur-sm">
      {currentAgent ? (
        <div className="flex items-center gap-3">
          <span className="text-2xl">{currentAgent.icon}</span>
          <div className="flex items-baseline gap-3">
            <h1 className="font-semibold text-slate-800">{currentAgent.name}</h1>
            <span className="text-xs text-slate-400 hidden sm:inline">
              {currentAgent.desc}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-slate-400 text-sm">AI 친구를 선택하면 대화를 시작할 수 있어요</div>
      )}
    </header>
  );
}
