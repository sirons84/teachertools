"use client";

import { useState, useEffect, useRef } from "react";
import type { LangCode } from "@/constants/languages";
import DocumentViewer from "./DocumentViewer";

interface Props {
  documentId: string;
  langCode: LangCode;
  originalHtml: string;
}

export default function TranslationView({ documentId, langCode, originalHtml }: Props) {
  const [html, setHtml] = useState(originalHtml);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false); // 번역 준비 중 (백그라운드 작업 대기)
  const cache = useRef<Record<string, string>>({ ko: originalHtml });
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (retryTimer.current) clearTimeout(retryTimer.current);

    if (langCode === "ko") {
      setHtml(originalHtml);
      setLoading(false);
      setPreparing(false);
      return;
    }

    if (cache.current[langCode]) {
      setHtml(cache.current[langCode]);
      setLoading(false);
      setPreparing(false);
      return;
    }

    setLoading(true);
    setError(null);
    setPreparing(false);

    const doFetch = (attempt = 0) => {
      fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, targetLang: langCode }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
          const translatedHtml: string = data.translation.html;
          cache.current[langCode] = translatedHtml;
          setHtml(translatedHtml);
          setLoading(false);
          setPreparing(false);
        })
        .catch((err: Error) => {
          // 백그라운드 번역이 아직 안 끝났을 때 → 재시도
          if (attempt < 3) {
            setPreparing(true);
            retryTimer.current = setTimeout(() => doFetch(attempt + 1), 3000);
          } else {
            setError(err.message);
            setLoading(false);
            setPreparing(false);
          }
        });
    };

    doFetch();

    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [langCode, documentId, originalHtml]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        번역 중 오류가 발생했습니다: {error}
      </div>
    );
  }

  return (
    <div>
      {preparing && (
        <div className="mb-3 flex items-center gap-2 text-xs text-blue-500 bg-blue-50 px-3 py-2 rounded-lg">
          <span className="animate-spin inline-block w-3 h-3 border border-blue-400 border-t-transparent rounded-full" />
          번역을 준비하고 있습니다... 잠시만 기다려주세요.
        </div>
      )}
      <DocumentViewer html={html} isLoading={loading && !preparing} />
    </div>
  );
}
