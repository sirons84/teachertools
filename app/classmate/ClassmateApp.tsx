"use client";

import type { ClassmateAgent } from "@/types/classmate";
import { AppProvider, useApp } from "./AppContext";
import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import WelcomeScreen from "./components/WelcomeScreen";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";

function MainArea() {
  const { currentAgent, messages } = useApp();

  return (
    <div className="flex-1 flex flex-col h-screen min-w-0">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto">
        {!currentAgent || messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <MessageList />
        )}
      </div>
      <ChatInput />
    </div>
  );
}

export default function ClassmateApp({ agents }: { agents: ClassmateAgent[] }) {
  return (
    <AppProvider agents={agents}>
      <div
        className="flex h-screen w-screen text-slate-800"
        style={{
          background:
            "linear-gradient(135deg, #fafaff 0%, #f3f1ff 50%, #fef1fc 100%)",
        }}
      >
        <Sidebar />
        <MainArea />
      </div>
    </AppProvider>
  );
}
