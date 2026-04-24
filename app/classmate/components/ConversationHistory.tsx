"use client";

import { useApp } from "../AppContext";
import type { ClassmateConversationSummary } from "@/types/classmate";

function groupByDate(items: ClassmateConversationSummary[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfLastWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

  const today: ClassmateConversationSummary[] = [];
  const yesterday: ClassmateConversationSummary[] = [];
  const lastWeek: ClassmateConversationSummary[] = [];
  const older: ClassmateConversationSummary[] = [];

  for (const c of items) {
    if (c.updatedAt >= startOfToday) today.push(c);
    else if (c.updatedAt >= startOfYesterday) yesterday.push(c);
    else if (c.updatedAt >= startOfLastWeek) lastWeek.push(c);
    else older.push(c);
  }

  return { today, yesterday, lastWeek, older };
}

function Group({
  label,
  items,
}: {
  label: string;
  items: ClassmateConversationSummary[];
}) {
  const { agents, currentConversationId, loadConversation, deleteConversation, setSidebarOpen } = useApp();
  if (items.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="text-[10px] text-slate-400 px-2 mb-1">{label}</div>
      <ul className="flex flex-col gap-0.5">
        {items.map((conv) => {
          const agent = agents.find((a) => a.id === conv.agentId);
          const active = currentConversationId === conv.id;
          return (
            <li key={conv.id} className="group relative">
              <button
                onClick={() => {
                  loadConversation(conv.id);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition ${
                  active
                    ? "bg-indigo-50 text-indigo-900"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-sm leading-none shrink-0">
                  {agent?.icon ?? "💬"}
                </span>
                <span className="truncate flex-1">{conv.title}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("이 대화를 삭제할까?")) deleteConversation(conv.id);
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs px-1.5 py-0.5 rounded transition"
                aria-label="삭제"
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function ConversationHistory() {
  const { conversations } = useApp();

  if (conversations.length === 0) {
    return (
      <div className="text-xs text-slate-400 px-2 py-4">
        아직 대화 기록이 없어요.
      </div>
    );
  }

  const { today, yesterday, lastWeek, older } = groupByDate(conversations);

  return (
    <>
      <Group label="오늘" items={today} />
      <Group label="어제" items={yesterday} />
      <Group label="지난주" items={lastWeek} />
      <Group label="이전" items={older} />
    </>
  );
}
