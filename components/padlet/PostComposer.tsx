"use client";

import { useState } from "react";
import { POST_COLORS } from "@/lib/padlet/colors";
import type { Attachment } from "./types";

type Tab = "text" | "image" | "file" | "link";

interface NewAttachmentDraft {
  type: "image" | "file" | "embed";
  url: string;
  filename?: string;
  fileSize?: number;
  mimeType?: string;
  embedMeta?: {
    type?: string;
    title?: string;
    thumbnail?: string;
    provider?: string;
    html?: string | null;
  };
}

interface Props {
  boardSlug: string;
  initialNickname: string;
  initialPosX?: number;
  initialPosY?: number;
  onClose: () => void;
  onCreated: () => void;
  onNicknameChange?: (n: string) => void;
  // 수정 모드용
  existingPost?: {
    id: string;
    contentText: string | null;
    color: string;
    attachments: Attachment[];
  };
}

export default function PostComposer({
  boardSlug,
  initialNickname,
  initialPosX,
  initialPosY,
  onClose,
  onCreated,
  onNicknameChange,
  existingPost,
}: Props) {
  const editing = !!existingPost;
  const initialTab: Tab = editing
    ? "text"
    : "text";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [nickname, setNickname] = useState(initialNickname);
  const [contentText, setContentText] = useState(existingPost?.contentText ?? "");
  const [color, setColor] = useState(existingPost?.color ?? POST_COLORS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [imageDraft, setImageDraft] = useState<NewAttachmentDraft | null>(null);
  const [fileDraft, setFileDraft] = useState<NewAttachmentDraft | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDraft, setLinkDraft] = useState<NewAttachmentDraft | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);

  const uploading = (kind: "image" | "file") => async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    const res = await fetch("/api/padlet/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "업로드 실패");
    const draft: NewAttachmentDraft = {
      type: kind === "image" ? "image" : "file",
      url: data.url,
      filename: data.filename,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
    };
    if (kind === "image") setImageDraft(draft);
    else setFileDraft(draft);
  };

  const onLinkPreview = async () => {
    if (!linkUrl.trim()) return;
    setLinkLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/padlet/embed/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: linkUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "미리보기 실패");
      setLinkDraft({
        type: "embed",
        url: data.url,
        embedMeta: data,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "미리보기 실패");
    } finally {
      setLinkLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const nick = nickname.trim();
    if (nick.length < 2 || nick.length > 20) {
      setError("닉네임은 2~20자여야 합니다.");
      return;
    }
    const text = contentText.trim();
    const attachments: NewAttachmentDraft[] = [];
    if (tab === "image" && imageDraft) attachments.push(imageDraft);
    if (tab === "file" && fileDraft) attachments.push(fileDraft);
    if (tab === "link" && linkDraft) attachments.push(linkDraft);

    if (!editing && text.length === 0 && attachments.length === 0) {
      setError("본문 또는 첨부가 필요합니다.");
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        const res = await fetch(`/api/padlet/posts/${existingPost.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contentText: text || null,
            color,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? "수정 실패");
        }
      } else {
        const res = await fetch(`/api/padlet/boards/${boardSlug}/posts`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            nickname: nick,
            contentText: text || null,
            color,
            posX: initialPosX,
            posY: initialPosY,
            attachments,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? "작성 실패");
        }
      }
      if (nick !== initialNickname) onNicknameChange?.(nick);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "작성 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "text", label: "텍스트", icon: "📝" },
    { id: "image", label: "이미지", icon: "🖼" },
    { id: "file", label: "파일", icon: "📎" },
    { id: "link", label: "링크", icon: "🔗" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[#1E293B]">
            {editing ? "글 수정" : "새 글 올리기"}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-800">
            ✕
          </button>
        </div>

        {!editing && (
          <div className="flex border-b border-gray-200">
            {tabs.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                  tab === t.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className="mr-1">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {!editing && tab === "image" && (
          <div className="space-y-2">
            <label className="block">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setError(null);
                  try {
                    await uploading("image")(f);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "업로드 실패");
                  }
                }}
                className="block w-full text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100"
              />
            </label>
            {imageDraft && (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageDraft.url}
                  alt="미리보기"
                  className="max-h-40 rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => setImageDraft(null)}
                  className="absolute top-1 right-1 bg-white/90 rounded-full w-6 h-6 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {!editing && tab === "file" && (
          <div className="space-y-2">
            <label className="block">
              <input
                type="file"
                accept=".pdf,.docx,.xlsx,.pptx,.zip"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setError(null);
                  try {
                    await uploading("file")(f);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "업로드 실패");
                  }
                }}
                className="block w-full text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100"
              />
            </label>
            {fileDraft && (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                <span className="truncate">📎 {fileDraft.filename}</span>
                <button
                  type="button"
                  onClick={() => setFileDraft(null)}
                  className="text-gray-400 hover:text-red-600 ml-2"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {!editing && tab === "link" && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
              <button
                type="button"
                onClick={onLinkPreview}
                disabled={linkLoading || !linkUrl.trim()}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-sm font-semibold rounded-lg"
              >
                {linkLoading ? "..." : "미리보기"}
              </button>
            </div>
            {linkDraft && (
              <div className="border border-gray-200 rounded-lg p-2 text-xs flex items-start gap-2">
                {linkDraft.embedMeta?.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={linkDraft.embedMeta.thumbnail}
                    alt=""
                    className="w-20 h-14 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    {linkDraft.embedMeta?.title ?? linkDraft.url}
                  </div>
                  <div className="text-gray-500 truncate">
                    {linkDraft.embedMeta?.type === "video" ? "▶ 영상" : "🔗 링크"}
                    {linkDraft.embedMeta?.provider && ` · ${linkDraft.embedMeta.provider}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLinkDraft(null)}
                  className="text-gray-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        <textarea
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder={
            editing
              ? "본문을 수정하세요."
              : tab === "text"
                ? "무엇을 공유할까요? (최대 1000자)"
                : "설명을 추가하세요 (선택)"
          }
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {POST_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                title={c.label}
                aria-label={`색 ${c.label}`}
                className={`w-6 h-6 rounded-full border ${
                  color === c.value ? "ring-2 ring-blue-500 border-white" : "border-gray-200"
                }`}
                style={{ background: c.value }}
              />
            ))}
          </div>

          {!editing && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500">닉네임</span>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                className="w-28 rounded-md border border-gray-200 px-2 py-1 focus:outline-none focus:border-blue-400"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl"
          >
            {submitting ? "올리는 중..." : editing ? "수정" : "올리기"}
          </button>
        </div>
      </form>
    </div>
  );
}
