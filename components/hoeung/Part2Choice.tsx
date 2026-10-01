"use client";

import { useState } from "react";
import type { AttemptStatus, Part2Item } from "@/lib/hoeung/items";
import { choiceStatus, judgePart2 } from "@/lib/hoeung/judge";
import type { LocalAttempt } from "@/lib/hoeung/store";
import { Feedback, GhostButton, InfoLine } from "./Feedback";

interface Props {
  item: Part2Item;
  attempt: LocalAttempt | undefined;
  onRecord: (answer: string, status: AttemptStatus, tries: number) => void;
}

/** PART2 알맞은 낱말 고르기 — 빈칸 문장 + 4지선다 */
export default function Part2Choice({ item, attempt, onRecord }: Props) {
  // 정답을 본 뒤의 「다시 풀기」는 연습일 뿐, 기록은 바뀌지 않는다
  const [practicing, setPracticing] = useState(false);
  const [practicePick, setPracticePick] = useState<number | null>(null);

  const resolved = attempt !== undefined && attempt.status !== "wrong";
  const picked = attempt ? Number(attempt.answer) : null;
  const interactive = !resolved || practicing;
  const [before, after = ""] = item.sentence.split("___");

  const tap = (i: number) => {
    if (practicing) {
      setPracticePick(i);
      return;
    }
    const tries = (attempt?.tries ?? 0) + 1;
    onRecord(String(i), choiceStatus(judgePart2(item, i), tries), tries);
  };

  const choiceClass = (i: number): string => {
    if (practicing) {
      if (practicePick !== i) return "border-gray-300 bg-white";
      return i === item.answer ? "border-green-500 bg-green-50" : "border-orange-500 bg-orange-50";
    }
    if (resolved) {
      if (i === item.answer) return "border-green-500 bg-green-50";
      if (attempt.status === "revealed" && i === picked) return "border-orange-500 bg-orange-50";
      return "border-gray-200 bg-white text-gray-400";
    }
    if (attempt?.status === "wrong" && i === picked) {
      return "border-gray-200 bg-gray-100 text-gray-400 line-through";
    }
    return "border-gray-300 bg-white";
  };

  const showAnswer = resolved && !practicing;

  return (
    <div className="space-y-5">
      <p className="text-[26px] font-semibold leading-loose text-gray-900">
        {before}
        <span
          className={`mx-1 inline-block min-w-24 border-b-4 px-2 text-center ${
            showAnswer ? "border-green-500" : "border-gray-400"
          }`}
        >
          {showAnswer ? item.choices[item.answer] : " "}
        </span>
        {after}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {item.choices.map((choice, i) => (
          <button
            key={i}
            type="button"
            disabled={!interactive || (!practicing && attempt?.status === "wrong" && i === picked)}
            onClick={() => tap(i)}
            className={`min-h-16 rounded-2xl border-2 px-4 text-[24px] font-semibold transition-transform active:scale-95 ${choiceClass(i)}`}
          >
            {choice}
          </button>
        ))}
      </div>

      {practicing ? (
        <>
          {practicePick !== null &&
            (practicePick === item.answer ? (
              <Feedback tone="good">좋아요!</Feedback>
            ) : (
              <Feedback tone="hint">다시 생각해 봐요. 힌트: {item.hint}</Feedback>
            ))}
          <GhostButton
            onClick={() => {
              setPracticing(false);
              setPracticePick(null);
            }}
          >
            연습 그만하기
          </GhostButton>
        </>
      ) : (
        <>
          {attempt?.status === "wrong" && <Feedback tone="hint">힌트: {item.hint}</Feedback>}

          {attempt?.status === "correct" && (
            <Feedback tone="good">
              <p className="font-bold">좋아요!</p>
              <InfoLine label="힌트">{item.hint}</InfoLine>
            </Feedback>
          )}

          {attempt?.status === "revealed" && (
            <>
              <Feedback tone="revealed">
                <p className="font-bold">
                  정답은 ‘{item.choices[item.answer]}’ 이에요. 다음에 또 만나요
                </p>
                <InfoLine label="내 답">{picked !== null ? item.choices[picked] : ""}</InfoLine>
                <InfoLine label="힌트">{item.hint}</InfoLine>
              </Feedback>
              <GhostButton onClick={() => setPracticing(true)}>다시 풀기</GhostButton>
            </>
          )}
        </>
      )}
    </div>
  );
}
