"use client";

import { useApp } from "../AppContext";

export default function AgentList() {
  const { agents, currentAgent, selectAgent, setSidebarOpen } = useApp();

  return (
    <ul className="flex flex-col gap-0.5">
      {agents.map((agent) => {
        const active = currentAgent?.id === agent.id;
        return (
          <li key={agent.id}>
            <button
              onClick={() => {
                selectAgent(agent);
                setSidebarOpen(false);
              }}
              title={agent.desc}
              className={`w-full text-left flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all duration-200 ${
                active
                  ? "bg-indigo-50 text-indigo-900 font-semibold border-l-4 border-indigo-500 pl-1.5"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="text-lg leading-none">{agent.icon}</span>
              <span className="truncate flex-1">{agent.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
