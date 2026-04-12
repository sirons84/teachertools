"use client";

import { useState, useRef, useEffect } from "react";
import type { LangCode } from "@/constants/languages";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  documentId: string;
  langCode: LangCode;
}

export default function ChatWindow({ documentId, langCode }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "안녕하세요! 가정통신문에 대해 궁금한 점을 질문해 주세요. / Hello! Please ask about the newsletter.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, message: text, langCode }),
      });

      if (!res.ok || !res.body) throw new Error("서버 오류가 발생했습니다.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: accumulated };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="border-t border-gray-200">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors"
      >
        <span className="font-semibold text-blue-700 flex items-center gap-2">
          <span>💬</span>
          <span>AI에게 질문하기</span>
        </span>
        <span className="text-blue-400 text-sm">{open ? "▲ 접기" : "▼ 열기"}</span>
      </button>

      {open && (
        <div className="flex flex-col bg-white">
          {/* Messages */}
          <div className="flex flex-col gap-3 p-4 max-h-80 overflow-y-auto">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    }
                    ${msg.role === "assistant" && !msg.content ? "animate-pulse min-w-[4rem] min-h-[2rem]" : ""}
                  `}
                >
                  {msg.content || (msg.role === "assistant" && loading ? "..." : "")}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지 입력... (Enter로 전송)"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 max-h-32"
              style={{ minHeight: "2.75rem" }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
            >
              전송
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
