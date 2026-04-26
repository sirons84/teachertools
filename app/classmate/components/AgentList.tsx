"use client";

import { useSession } from "next-auth/react";
import { useApp } from "../AppContext";
import { LOGIN_REQUIRED_AGENT_IDS } from "@/lib/classmate-auth";

export default function AgentList() {
  const { agents, currentAgent, selectAgent, setSidebarOpen } = useApp();
  const { status } = useSession();
  const isAuthed = status === "authenticated";

  return (
    <ul className="flex flex-col gap-0.5">
      {agents.map((agent) => {
        const active = currentAgent?.id === agent.id;
        const requiresLogin = LOGIN_REQUIRED_AGENT_IDS.has(agent.id);
        const locked = requiresLogin && !isAuthed;
        return (
          <li key={agent.id}>
            <button
              onClick={() => {
                selectAgent(agent);
                setSidebarOpen(false);
              }}
              title={locked ? `${agent.desc} (로그인 필요)` : agent.desc}
              className={`w-full text-left flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all duration-200 ${
                active
                  ? "bg-indigo-50 text-indigo-900 font-semibold border-l-4 border-indigo-500 pl-1.5"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="text-lg leading-none">{agent.icon}</span>
              <span className="truncate flex-1">{agent.name}</span>
              {locked && (
                <span
                  className="text-slate-400 text-xs"
                  aria-label="로그인 필요"
                >
                  🔒
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
