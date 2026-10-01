"use client";

import { DOT_CLASS, dotKind, type HoeungItem } from "@/lib/hoeung/items";

interface Props {
  items: HoeungItem[];
  /** itemId → 풀이 상태 */
  statusOf: (itemId: string) => { status: string; checked: boolean } | undefined;
  currentId: string | null;
  onSelect: (itemId: string) => void;
}

/**
 * 문항 점 띠 — 점을 누르면 그 문제로 바로 간다.
 * 회색(안 품) / 초록(맞음) / 주황(두 번 틀려 정답 봄) / 노랑(확인 필요) / 파랑(현재)
 */
export default function ProgressStrip({ items, statusOf, currentId, onSelect }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="문항">
      {items.map((it, i) => {
        const attempt = statusOf(it.id);
        const kind = dotKind(attempt?.status);
        const current = it.id === currentId;
        const color = current && kind === "todo" ? "bg-blue-500 text-white" : DOT_CLASS[kind];
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={current}
            aria-label={`${i + 1}번 문제`}
            onClick={() => onSelect(it.id)}
            className={`relative h-11 w-11 rounded-full text-lg font-bold transition-transform active:scale-95 ${color} ${
              current ? "ring-4 ring-blue-500 ring-offset-2" : ""
            }`}
          >
            {i + 1}
            {attempt?.checked && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-gray-700 shadow">
                ✔
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
