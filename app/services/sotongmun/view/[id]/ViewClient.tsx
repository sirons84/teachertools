"use client";

import { useState } from "react";
import type { LangCode } from "@/constants/languages";
import LanguageSelector from "@/components/sotongmun/LanguageSelector";
import TranslationView from "@/components/sotongmun/TranslationView";
import ChatWindow from "@/components/sotongmun/ChatWindow";

interface Props {
  documentId: string;
  title: string;
  originalHtml: string;
  createdAt: string;
}

export default function ViewClient({ documentId, title, originalHtml, createdAt }: Props) {
  const [langCode, setLangCode] = useState<LangCode>("ko");

  const date = new Date(createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-0 sm:px-6 pb-10">
      {/* Language Selector Bar */}
      <div className="sticky top-14 z-40 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <LanguageSelector value={langCode} onChange={setLangCode} />
      </div>

      {/* Document Content */}
      <div className="bg-white mx-0 sm:mx-0 sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-sm overflow-hidden">
        {/* Document Header */}
        <div className="px-5 pt-6 pb-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-[#1E293B] leading-snug">{title}</h1>
          <p className="mt-1 text-xs text-gray-400">{date}</p>
        </div>

        {/* Document Body */}
        <div className="px-5 py-5">
          <TranslationView
            documentId={documentId}
            langCode={langCode}
            originalHtml={originalHtml}
          />
        </div>

        {/* Chat */}
        <ChatWindow documentId={documentId} langCode={langCode} />
      </div>
    </main>
  );
}
