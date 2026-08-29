"use client";

import { useMemo, useState } from "react";
import { parseRosterText, type RosterEntry } from "@/lib/nuga";

interface Props {
  initialText?: string;
  onSave: (roster: RosterEntry[]) => void;
  onCancel?: () => void;
}

export default function RosterSetup({ initialText = "", onSave, onCancel }: Props) {
  const [text, setText] = useState(initialText);

  const { roster, errors } = useMemo(() => parseRosterText(text), [text]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-white rounded-2xl border-2 border-rose-100 p-5 sm:p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#1E293B]">명단 등록</h2>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-600">번호 공백 이름</span> 형식으로 한 줄씩
          붙여넣으세요. 명단은 이 기기의 브라우저에만 저장되며 서버로 전송되지 않습니다.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          spellCheck={false}
          placeholder={"1 홍길동\n2 김철수\n3 이영희"}
          className="mt-4 w-full rounded-xl border border-gray-200 p-3 text-sm font-mono leading-6 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-semibold">
            {roster.length}명 인식됨
          </span>
          {roster.length > 0 && (
            <span className="text-gray-500">
              1번 {roster[0].name} … {roster[roster.length - 1].no}번{" "}
              {roster[roster.length - 1].name}
            </span>
          )}
        </div>

        {errors.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-amber-700 bg-amber-50 rounded-xl p-3">
            {errors.slice(0, 6).map((e, i) => (
              <li key={i}>· {e}</li>
            ))}
            {errors.length > 6 && <li>· 그 외 {errors.length - 6}건</li>}
          </ul>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={roster.length === 0}
            onClick={() => onSave(roster)}
            className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold disabled:bg-gray-200 disabled:text-gray-400 hover:bg-rose-700 transition-colors"
          >
            {roster.length > 0 ? `${roster.length}명 저장하기` : "명단을 붙여넣어 주세요"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50"
            >
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
