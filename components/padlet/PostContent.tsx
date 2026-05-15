"use client";

import type { Attachment } from "./types";

const URL_RE = /(https?:\/\/[^\s<>"']+)/g;

export function TextContent({ text }: { text: string }) {
  // 자동 링크화
  const parts = text.split(URL_RE);
  return (
    <p className="text-sm whitespace-pre-wrap break-words text-[#1E293B]">
      {parts.map((p, i) => {
        if (i % 2 === 1) {
          return (
            <a
              key={i}
              href={p}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-700 underline break-all"
            >
              {p}
            </a>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </p>
  );
}

export function ImageAttachment({ a }: { a: Attachment }) {
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="block rounded-lg overflow-hidden border border-white/40"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={a.url}
        alt={a.filename ?? "이미지"}
        loading="lazy"
        className="w-full h-auto max-h-64 object-cover"
      />
    </a>
  );
}

export function FileAttachment({ a }: { a: Attachment }) {
  const sizeKb = a.fileSize ? (a.fileSize / 1024).toFixed(0) : null;
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      download={a.filename ?? undefined}
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-2 p-2 bg-white/70 hover:bg-white rounded-lg text-xs"
    >
      <span className="text-xl">📎</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[#1E293B] truncate">{a.filename ?? "파일"}</div>
        {sizeKb && <div className="text-gray-500">{sizeKb} KB</div>}
      </div>
      <span className="text-blue-600 font-semibold">받기</span>
    </a>
  );
}

export function EmbedAttachment({ a }: { a: Attachment }) {
  const meta = (a.embedMeta ?? {}) as Record<string, unknown>;
  const isVideo = meta.type === "video";
  const title = typeof meta.title === "string" && meta.title.length > 0 ? meta.title : a.url;
  const thumbnail = typeof meta.thumbnail === "string" ? meta.thumbnail : null;
  const provider = typeof meta.provider === "string" ? meta.provider : null;

  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="block rounded-lg overflow-hidden border border-white/40 bg-white/70 hover:bg-white"
    >
      {thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt={title}
          loading="lazy"
          className="w-full max-h-40 object-cover"
        />
      )}
      <div className="p-2">
        <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase">
          {isVideo ? "▶ 영상" : "🔗 링크"}
          {provider && <span>· {provider}</span>}
        </div>
        <div className="text-xs font-semibold text-[#1E293B] line-clamp-2">{title}</div>
      </div>
    </a>
  );
}

export function AttachmentRenderer({ a }: { a: Attachment }) {
  if (a.type === "image") return <ImageAttachment a={a} />;
  if (a.type === "file") return <FileAttachment a={a} />;
  if (a.type === "embed") return <EmbedAttachment a={a} />;
  return null;
}
