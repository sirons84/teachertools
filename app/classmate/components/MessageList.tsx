"use client";

import { useEffect, useRef } from "react";
import { useApp } from "../AppContext";
import MessageBubble from "./MessageBubble";

export default function MessageList() {
  const { messages, currentAgent, isStreaming } = useApp();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const agentIcon = currentAgent?.icon ?? "🤖";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
      {messages.map((m, idx) => {
        const isLast = idx === messages.length - 1;
        return (
          <MessageBubble
            key={m.id}
            message={m}
            agentIcon={agentIcon}
            isStreaming={isStreaming && isLast && m.role === "assistant"}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
