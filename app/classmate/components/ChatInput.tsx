"use client";

import { useEffect, useRef } from "react";
import { useApp } from "../AppContext";

export default function ChatInput() {
  const {
    currentAgent,
    isStreaming,
    pendingInput,
    setPendingInput,
    sendMessage,
  } = useApp();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [pendingInput]);

  const disabled = !currentAgent || isStreaming;

  const submit = () => {
    const value = pendingInput.trim();
    if (!value || disabled) return;
    setPendingInput("");
    sendMessage(value);
  };

  return (
    <div className="shrink-0 px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <div
          className={`flex items-end gap-2 rounded-2xl bg-white border shadow-sm transition ${
            disabled ? "border-slate-200 opacity-80" : "border-slate-300 focus-within:border-indigo-400 focus-within:shadow-md"
          }`}
        >
          <textarea
            ref={textareaRef}
            value={pendingInput}
            onChange={(e) => setPendingInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            disabled={disabled}
            placeholder={
              currentAgent
                ? `${currentAgent.name}에게 메시지 보내기...`
                : "먼저 AI 친구를 선택해줘"
            }
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none px-4 py-3.5 text-sm placeholder:text-slate-400 min-h-[56px] max-h-[200px]"
          />
          <button
            onClick={submit}
            disabled={disabled || !pendingInput.trim()}
            className={`m-2 w-9 h-9 rounded-full flex items-center justify-center transition ${
              disabled || !pendingInput.trim()
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white hover:shadow-md"
            }`}
            aria-label="전송"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path
                d="M5 12l14-7-4 14-3-5-7-2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="mt-1.5 text-[10px] text-slate-400 text-center">
          Enter로 전송 · Shift+Enter 줄바꿈
        </div>
      </div>
    </div>
  );
}
