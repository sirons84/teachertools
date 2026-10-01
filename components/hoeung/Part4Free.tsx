"use client";

import { useState, type FormEvent } from "react";
import type { AttemptStatus, Part4Item } from "@/lib/hoeung/items";
import type { LocalAttempt } from "@/lib/hoeung/store";
import { GhostButton } from "./Feedback";

interface Props {
  item: Part4Item;
  attempt: LocalAttempt | undefined;
  onRecord: (answer: string, status: AttemptStatus, tries: number) => void;
  /** 처음 제출하면 바로 다음 문항으로 */
  onNext: () => void;
}

/** PART4 문장 만들기 — 낱말 두 개로 자유롭게 한 줄. 채점 없음, 제출만 */
export default function Part4Free({ item, attempt, onRecord, onNext }: Props) {
  const [text, setText] = useState(attempt?.answer ?? "");
  const [editing, setEditing] = useState(attempt === undefined);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const answer = text.trim();
    if (!answer) return;
    const first = attempt === undefined;
    onRecord(answer, "submitted", (attempt?.tries ?? 0) + 1);
    setEditing(false);
    if (first) onNext();
  };

  const words = (
    <div className="flex flex-wrap items-center gap-3">
      {item.words.map((w) => {
        const used = text.includes(w);
        return (
          <span
            key={w}
            className={`rounded-2xl border-2 px-5 py-2 text-[26px] font-bold ${
              used ? "border-green-500 bg-green-50 text-gray-900" : "border-gray-300 bg-white text-gray-900"
            }`}
          >
            {w}
            {used ? " ✓" : ""}
          </span>
        );
      })}
    </div>
  );

  if (editing) {
    return (
      <form onSubmit={submit} className="space-y-5">
        {words}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          enterKeyHint="done"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={200}
          placeholder="여기에 문장을 써요"
          aria-label="만든 문장"
          className="w-full rounded-2xl border-2 border-gray-300 bg-white px-4 py-4 text-[22px] text-gray-900 outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="min-h-14 w-full rounded-2xl bg-gray-900 px-6 text-xl font-bold text-white disabled:bg-gray-300"
        >
          제출
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      {words}
      <div className="rounded-2xl border-2 border-green-500 bg-green-50 px-5 py-4">
        <p className="text-base font-semibold text-gray-500">내가 만든 문장</p>
        <p className="mt-1 text-[24px] font-semibold leading-relaxed text-gray-900">
          {attempt?.answer}
        </p>
      </div>
      <GhostButton onClick={() => setEditing(true)}>고쳐 쓰기</GhostButton>
    </div>
  );
}
