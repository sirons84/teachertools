"use client";

import { useState, useEffect } from "react";
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
  const [cache, setCache] = useState<Record<string, string>>({ ko: originalHtml });

  useEffect(() => {
    if (langCode === "ko") {
      setHtml(originalHtml);
      return;
    }

    if (cache[langCode]) {
      setHtml(cache[langCode]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, targetLang: langCode }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        const translatedHtml: string = data.translation.html;
        setCache((prev) => ({ ...prev, [langCode]: translatedHtml }));
        setHtml(translatedHtml);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [langCode, documentId, originalHtml, cache]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        번역 중 오류가 발생했습니다: {error}
      </div>
    );
  }

  return <DocumentViewer html={html} isLoading={loading} />;
}
