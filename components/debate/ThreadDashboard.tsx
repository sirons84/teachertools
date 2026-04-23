"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { DebateThread } from "@/lib/types/session";

interface Props {
  sessionId: string;
  threads: DebateThread[];
}

export default function ThreadDashboard({ sessionId, threads }: Props) {
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    setBaseUrl(base);
    (async () => {
      const entries = await Promise.all(
        threads.map(async (t) => {
          const url = `${base}/debate/${sessionId}/thread/${t.id}`;
          const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1 });
          return [t.id, dataUrl] as const;
        })
      );
      setQrMap(Object.fromEntries(entries));
    })();
  }, [sessionId, threads]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        학생들에게 QR을 보여주세요. 각 학생은 본인 쓰레드에서 입장을 선택하고 토론을 진행합니다.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {threads.map((t) => {
          const url = `${baseUrl}/debate/${sessionId}/thread/${t.id}`;
          const qr = qrMap[t.id];
          const statusLabel = statusText(t);
          return (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center gap-2">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-[#1E293B]">#{t.index + 1}</span>
                <StatusPill thread={t} />
              </div>
              {qr ? (
                <img src={qr} alt={`QR ${t.index + 1}`} className="w-32 h-32" />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded animate-pulse" />
              )}
              <div className="text-xs text-gray-500 text-center leading-tight min-h-[2.25rem]">
                {t.studentLabel ? (
                  <div className="font-semibold text-[#1E293B]">{t.studentLabel}</div>
                ) : (
                  <div className="text-gray-300">미참가</div>
                )}
                <div className="text-[11px] text-gray-400">{statusLabel}</div>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 hover:underline break-all"
              >
                링크 열기
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function statusText(t: DebateThread): string {
  if (t.status === "finished") return `종료 · ${t.turns.length}턴`;
  if (t.status === "active") return `${t.position ?? "?"} · ${t.turns.length}턴`;
  return "QR 대기";
}

function StatusPill({ thread }: { thread: DebateThread }) {
  if (thread.status === "finished") {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">완료</span>;
  }
  if (thread.status === "active") {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">진행중</span>;
  }
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">대기</span>;
}
