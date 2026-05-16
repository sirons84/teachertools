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
    <div className="space-y-2.5">
      <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          <p className="text-sm text-gray-500">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">아직 댓글이 없습니다.</p>
        ) : (
          items.map((c) => (
            <div
              key={c.id}
              className="bg-white/85 rounded-lg px-2.5 py-2 text-sm flex items-start gap-1.5"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-700 text-xs truncate">{c.nickname}</div>
                <div className="text-gray-800 whitespace-pre-wrap break-words leading-snug">{c.content}</div>
              </div>
              {mySessionId === c.sessionId && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="text-gray-400 hover:text-red-600 text-sm leading-none mt-0.5"
                  aria-label="댓글 삭제"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={submit} className="space-y-1.5">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임"
          maxLength={20}
          className="w-full rounded-md border border-white/80 bg-white/85 px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400"
        />
        <div className="flex gap-1.5">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 남겨주세요"
            maxLength={500}
            className="flex-1 min-w-0 rounded-md border border-white/80 bg-white/85 px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={submitting || content.trim().length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-md text-sm font-semibold shrink-0"
          >
            등록
          </button>
        </div>
      </form>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
