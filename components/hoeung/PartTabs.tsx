"use client";

import type { Part } from "@/lib/hoeung/items";

export interface PartTab {
  part: Part;
  title: string;
  unlocked: boolean;
  done: boolean;
}

interface Props {
  tabs: PartTab[];
  active: Part;
  onSelect: (part: Part) => void;
}

/** PART 탭 — 앞 PART를 모두 지나가야 다음이 열린다. 열린 PART는 언제든 오갈 수 있다 */
export default function PartTabs({ tabs, active, onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {tabs.map((t) => {
        const isActive = t.part === active;
        return (
          <button
            key={t.part}
            type="button"
            disabled={!t.unlocked}
            onClick={() => onSelect(t.part)}
            aria-current={isActive ? "true" : undefined}
            className={`flex min-h-12 flex-col items-center justify-center rounded-xl border-2 px-1 py-1 leading-tight transition-colors ${
              isActive
                ? "border-blue-500 bg-white text-gray-900"
                : t.unlocked
                  ? "border-gray-200 bg-white text-gray-600"
                  : "border-gray-100 bg-gray-50 text-gray-300"
            }`}
          >
            <span className="text-sm font-bold">
              {t.unlocked ? "" : "🔒 "}
              PART {t.part}
              {t.done ? " ✓" : ""}
            </span>
            <span className="hidden text-xs sm:block">{t.title}</span>
          </button>
        );
      })}
    </div>
  );
}
