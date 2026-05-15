"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommentDto } from "./types";

export default function CommentList({
  postId,
  mySessionId,
  myNickname,
  onCountChange,
}: {
  postId: string;
  mySessionId: string | null;
  myNickname: string | null;
  onCountChange?: (count: number) => void;
}) {
  const [items, setItems] = useState<CommentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [nickname, setNickname] = useState(myNickname ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/padlet/posts/${postId}/comments`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.comments)) {
        setItems(data.comments);
        onCountChange?.(data.comments.length);
      }
    }
    setLoading(false);
  }, [postId, onCountChange]);

  useEffect(() => {
    load();
    const t = setInterval(load, 7000);
    return () => clearInterval(t);
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const trimmed = content.trim();
    if (trimmed.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/padlet/posts/${postId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() || "익명", content: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "댓글 작성 실패");
      setItems((prev) => [...prev, data.comment]);
      onCountChange?.(items.length + 1);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "댓글 작성 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("이 댓글을 삭제할까요?")) return;
    const res = await fetch(`/api/padlet/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      const next = items.filter((c) => c.id !== id);
      setItems(next);
      onCountChange?.(next.length);
    }
  };

  return (
    <div className="space-y-2">
      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
        {loading ? (
          <p className="text-xs text-gray-400">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-gray-400">아직 댓글이 없습니다.</p>
        ) : (
          items.map((c) => (
            <div
              key={c.id}
              className="bg-white/80 rounded-lg px-2 py-1.5 text-xs flex items-start gap-1"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-700 truncate">{c.nickname}</div>
                <div className="text-gray-800 whitespace-pre-wrap break-words">{c.content}</div>
              </div>
              {mySessionId === c.sessionId && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="text-gray-400 hover:text-red-600"
                  aria-label="댓글 삭제"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={submit} className="flex gap-1.5">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임"
          maxLength={20}
          className="w-20 rounded-md border border-white/80 bg-white/80 px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
        />
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 남겨주세요"
          maxLength={500}
          className="flex-1 rounded-md border border-white/80 bg-white/80 px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
        />
        <button
          type="submit"
          disabled={submitting || content.trim().length === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-2.5 py-1 rounded-md text-xs font-semibold"
        >
          등록
        </button>
      </form>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
