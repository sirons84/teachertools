"use client";

import { useState, type FormEvent } from "react";
import type { AttemptStatus, Part3Item } from "@/lib/hoeung/items";
import { judgePart3 } from "@/lib/hoeung/judge";
import type { LocalAttempt } from "@/lib/hoeung/store";
import { Feedback, GhostButton, InfoLine } from "./Feedback";

interface Props {
  item: Part3Item;
  attempt: LocalAttempt | undefined;
  onRecord: (answer: string, status: AttemptStatus, tries: number) => void;
}

/**
 * PART3 문장 고치기 — 틀린 부분만 빈칸, 그 자리만 타자.
 * 정규식을 통과하면 "ok", 아니면 "needs-check"(오답이 아니라 선생님 확인 대기). 막지 않는다.
 */
export default function Part3Blank({ item, attempt, onRecord }: Props) {
  const [text, setText] = useState(attempt?.answer ?? "");
  const [editing, setEditing] = useState(attempt === undefined);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const answer = text.trim();
    if (!answer) return;
    onRecord(answer, judgePart3(item, answer), (attempt?.tries ?? 0) + 1);
    setEditing(false);
  };

  if (editing) {
    return (
      <form onSubmit={submit} className="space-y-5">
        <p className="text-[26px] font-semibold leading-loose text-gray-900">
          {item.before}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            enterKeyHint="done"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={60}
            aria-label="빈칸에 들어갈 말"
            className="mx-1 inline-block w-64 max-w-full rounded-lg border-b-4 border-blue-500 bg-gray-50 px-3 py-1 text-[26px] font-semibold text-gray-900 outline-none"
          />
          {item.after}
        </p>
        {attempt && <Feedback tone="hint">힌트: {item.hint}</Feedback>}
        <button
          type="submit"
          disabled={!text.trim()}
          className="min-h-14 w-full rounded-2xl bg-gray-900 px-6 text-xl font-bold text-white disabled:bg-gray-300"
        >
          확인
        </button>
      </form>
    );
  }

  const ok = attempt?.status === "ok";

  return (
    <div className="space-y-5">
      <p className="text-[26px] font-semibold leading-loose text-gray-900">
        {item.before}
        <span
          className={`mx-1 inline-block border-b-4 px-2 ${
            ok ? "border-green-500" : "border-yellow-400"
          }`}
        >
          {attempt?.answer}
        </span>
        {item.after}
      </p>

      {ok ? (
        <Feedback tone="good">
          <p className="font-bold">좋아요!</p>
          <InfoLine label="예시 답">{item.model}</InfoLine>
          <InfoLine label="힌트">{item.hint}</InfoLine>
        </Feedback>
      ) : (
        <>
          <Feedback tone="check">
            <p className="font-bold">선생님이 확인해 줄 거예요</p>
            <InfoLine label="내 답">{attempt?.answer}</InfoLine>
            {/* 예시 답은 선생님과 확인한 뒤에 보여 준다 (베껴 쓰면 확인 표시가 사라지므로) */}
            {attempt?.checked && <InfoLine label="예시 답">{item.model}</InfoLine>}
            <InfoLine label="힌트">{item.hint}</InfoLine>
          </Feedback>
          <GhostButton onClick={() => setEditing(true)}>다시 써 보기</GhostButton>
        </>
      )}
    </div>
  );
}
