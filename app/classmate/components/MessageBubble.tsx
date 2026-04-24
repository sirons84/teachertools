"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ClassmateMessage } from "@/types/classmate";

export default function MessageBubble({
  message,
  agentIcon,
  isStreaming,
}: {
  message: ClassmateMessage;
  agentIcon: string;
  isStreaming: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    );
  }

  const empty = message.content.length === 0;

  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg">
        {agentIcon}
      </div>
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 bg-white border border-slate-200 shadow-sm">
        {empty && isStreaming ? (
          <div className="flex items-center gap-1 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
          </div>
        ) : (
          <div className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-slate-400 animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
