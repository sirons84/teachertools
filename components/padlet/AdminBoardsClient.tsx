"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BOARD_BG_COLORS } from "@/lib/padlet/colors";

interface AdminBoard {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  bgColor: string;
  isArchived: boolean;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminBoardsClient({ initialBoards }: { initialBoards: AdminBoard[] }) {
  const router = useRouter();
  const [boards, setBoards] = useState<AdminBoard[]>(initialBoards);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch("/api/padlet/admin/boards", { cache: "no-store" });
    const data = await res.json();
    if (Array.isArray(data.boards)) setBoards(data.boards);
  };

  const logout = async () => {
    await fetch("/api/padlet/admin/logout", { method: "POST" });
    router.replace("/services/padlet/admin/login");
    router.refresh();
  };

  const onArchive = async (b: AdminBoard) => {
    await fetch(`/api/padlet/admin/boards/${b.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isArchived: !b.isArchived }),
    });
    await refresh();
  };

  const onDelete = async (b: AdminBoard) => {
    if (!confirm(`"${b.title}" 보드를 삭제할까요? 모든 글이 함께 삭제됩니다.`)) return;
    await fetch(`/api/padlet/admin/boards/${b.id}`, { method: "DELETE" });
    await refresh();
  };

  const onRename = async (b: AdminBoard) => {
    const next = prompt("새 보드 제목", b.title)?.trim();
    if (!next || next === b.title) return;
    await fetch(`/api/padlet/admin/boards/${b.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: next }),
    });
    await refresh();
  };

  const onBgColor = async (b: AdminBoard, color: string) => {
    await fetch(`/api/padlet/admin/boards/${b.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bgColor: color }),
    });
    await refresh();
  };

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/services/padlet/b/${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(slug);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      window.prompt("아래 링크를 복사하세요:", url);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <span>＋</span>
          <span>새 보드 만들기</span>
        </button>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          로그아웃
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center text-gray-400">
          아직 만든 보드가 없습니다. 새 보드를 만들어보세요.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {boards.map((b) => (
            <div
              key={b.id}
              className={`bg-white border-2 rounded-2xl p-5 shadow-sm flex flex-col gap-3 ${
                b.isArchived ? "border-gray-200 opacity-60" : "border-blue-100"
              }`}
            >
              <div
                className="h-2 rounded-full"
                style={{ background: b.bgColor }}
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-[#1E293B] truncate">{b.title}</h3>
                  {b.isArchived && (
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                      보관됨
                    </span>
                  )}
                </div>
                {b.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{b.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>글 {b.postCount}개</span>
                <span>{new Date(b.createdAt).toLocaleDateString("ko-KR")}</span>
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                {BOARD_BG_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onBgColor(b, c.value)}
                    title={c.label}
                    aria-label={`배경색 ${c.label}`}
                    className={`w-5 h-5 rounded-full border ${
                      b.bgColor === c.value ? "ring-2 ring-blue-500 border-white" : "border-gray-200"
                    }`}
                    style={{ background: c.value }}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href={`/services/padlet/admin/boards/${b.slug}`}
                  className="text-center text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg py-2"
                >
                  관리
                </Link>
                <button
                  onClick={() => copyLink(b.slug)}
                  className="text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg py-2"
                >
                  {copied === b.slug ? "✓ 복사됨" : "🔗 링크 복사"}
                </button>
                <button
                  onClick={() => onRename(b)}
                  className="text-xs text-gray-500 hover:text-gray-800 rounded-lg py-1"
                >
                  이름 변경
                </button>
                <button
                  onClick={() => onArchive(b)}
                  className="text-xs text-gray-500 hover:text-gray-800 rounded-lg py-1"
                >
                  {b.isArchived ? "복원" : "보관"}
                </button>
                <button
                  onClick={() => onDelete(b)}
                  className="col-span-2 text-xs text-red-500 hover:text-red-700 rounded-lg py-1"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateBoardDialog
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            setShowCreate(false);
            await refresh();
          }}
        />
      )}
    </>
  );
}

function CreateBoardDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (b: AdminBoard) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bgColor, setBgColor] = useState<string>(BOARD_BG_COLORS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/padlet/admin/boards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), bgColor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "생성 실패");
      onCreated(data.board);
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 실패");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
      >
        <h2 className="font-bold text-lg text-[#1E293B]">새 보드 만들기</h2>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">제목 *</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            required
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            placeholder="예: 봄 소풍 소감 나누기"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">설명</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={3}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
            placeholder="이 보드의 목적이나 안내 (선택)"
          />
        </label>

        <div>
          <span className="text-sm font-medium text-gray-700">배경색</span>
          <div className="flex items-center gap-2 mt-2">
            {BOARD_BG_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setBgColor(c.value)}
                title={c.label}
                className={`w-8 h-8 rounded-full border ${
                  bgColor === c.value ? "ring-2 ring-blue-500 border-white" : "border-gray-200"
                }`}
                style={{ background: c.value }}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting || title.trim().length === 0}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl"
          >
            {submitting ? "생성 중..." : "만들기"}
          </button>
        </div>
      </form>
    </div>
  );
}
