"use client";

import { useApp } from "../AppContext";

export default function WelcomeScreen() {
  const { currentAgent, agents, selectAgent, setPendingInput, sendMessage } = useApp();

  if (!currentAgent) {
    return (
      <div className="h-full flex items-center justify-center px-6 animate-fade-in">
        <div className="max-w-xl w-full text-center">
          <div className="text-6xl mb-4">🎒</div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            ClassMate AI
          </h1>
          <p className="text-slate-500 mb-8">
            수업에서 궁금한 걸 AI 친구에게 편하게 물어봐!
          </p>
          <div className="grid grid-cols-2 gap-3">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => selectAgent(agent)}
                className="text-left p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition"
              >
                <div className="text-2xl mb-2">{agent.icon}</div>
                <div className="font-semibold text-sm text-slate-800">{agent.name}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{agent.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center px-6 animate-fade-in">
      <div className="max-w-2xl w-full text-center">
        <div className="text-6xl mb-4">{currentAgent.icon}</div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
          {currentAgent.name}
        </h1>
        <p className="text-slate-600 mb-2">{currentAgent.greeting}</p>
        <p className="text-xs text-slate-400 mb-10">{currentAgent.desc}</p>

        <div className="flex flex-wrap gap-2 justify-center">
          {currentAgent.chips.map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setPendingInput("");
                sendMessage(chip);
              }}
              className="px-4 py-2 rounded-full text-sm bg-white/80 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 transition"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
