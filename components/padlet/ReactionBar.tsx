"use client";

import { useCallback, useState } from "react";
import type { ReactionTally } from "./types";

const EMOJIS = ["👍", "❤️", "😂", "🎉", "😮", "👏"] as const;

export default function ReactionBar({
  postId,
  initial,
  mySessionId,
  onMutated,
}: {
  postId: string;
  initial: ReactionTally;
  mySessionId: string | null;
  onMutated?: () => void;
}) {
  const [tally, setTally] = useState<ReactionTally>(initial);
  const [pending, setPending] = useState(false);

  const toggle = useCallback(
    async (emoji: string) => {
      if (pending) return;
      if (!mySessionId) {
        // 세션 없을 때는 일단 요청만 보내고 서버가 쿠키를 굽도록 함
      }
      setPending(true);
      // 옵티미스틱 업데이트
      setTally((prev) => {
        const next = { ...prev };
        const slot = next[emoji] ?? { count: 0, sessions: [] };
        const has = mySessionId ? slot.sessions.includes(mySessionId) : false;
        if (has && mySessionId) {
          next[emoji] = {
            count: Math.max(0, slot.count - 1),
            sessions: slot.sessions.filter((s) => s !== mySessionId),
          };
        } else {
          next[emoji] = {
            count: slot.count + 1,
            sessions: mySessionId ? [...slot.sessions, mySessionId] : slot.sessions,
          };
        }
        return next;
      });
      try {
        await fetch(`/api/padlet/posts/${postId}/reactions`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
        onMutated?.();
      } finally {
        setPending(false);
      }
    },
    [postId, pending, mySessionId, onMutated]
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {EMOJIS.map((e) => {
        const slot = tally[e];
        const count = slot?.count ?? 0;
        const mine = mySessionId && slot?.sessions.includes(mySessionId);
        return (
          <button
            key={e}
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              toggle(e);
            }}
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border transition-colors ${
              mine
                ? "bg-white border-blue-300 shadow-sm"
                : count > 0
                  ? "bg-white/70 border-white/70 hover:bg-white"
                  : "bg-transparent border-transparent text-gray-500 hover:bg-white/50"
            }`}
            aria-label={`${e} 반응`}
          >
            <span>{e}</span>
            {count > 0 && <span className="font-semibold">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
