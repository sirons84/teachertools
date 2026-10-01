"use client";

import { BADGE_META, IDLE_MS, type Badge } from "@/lib/hoeung/badge";
import type { DashStudent } from "@/lib/hoeung/dashboard";
import { DOT_CLASS, PARTS, TOTAL_ITEMS, dotKind, itemLabel } from "@/lib/hoeung/items";

const BADGE_CLASS: Record<Badge, string> = {
  STUCK: "bg-red-600 text-white",
  WRONG2: "bg-orange-500 text-white",
  CHECK: "bg-yellow-400 text-gray-900",
  IDLE: "bg-gray-200 text-gray-600",
  OK: "bg-transparent text-gray-400",
};

export function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}초`;
  if (sec < 3600) return `${Math.floor(sec / 60)}분 ${sec % 60}초`;
  return `${Math.floor(sec / 3600)}시간 넘음`;
}

function nowText(s: DashStudent): string {
  // 뱃지가 무엇이든, 패드 신호가 끊긴 학생의 "지금"은 믿을 수 없다
  if (s.secondsSinceActive * 1000 >= IDLE_MS) {
    return `신호 없음 ${formatDuration(s.secondsSinceActive)}`;
  }
  if (s.currentItemId && s.secondsOnItem !== null) {
    return `${itemLabel(s.currentItemId)} · ${formatDuration(s.secondsOnItem)}`;
  }
  return s.passedCount >= TOTAL_ITEMS ? "다 함" : "—";
}

interface Props {
  student: DashStudent;
  selected: boolean;
  onSelect: (id: string) => void;
}

/** 대시보드 한 행 = 학생 한 명. 뱃지 색만 눈에 띄고 나머지는 흐리게 */
export default function StudentRow({ student, selected, onSelect }: Props) {
  const meta = BADGE_META[student.badge];
  const byItem = new Map(student.attempts.map((a) => [a.itemId, a]));
  const calm = student.badge === "OK" || student.badge === "IDLE";

  return (
    <tr
      onClick={() => onSelect(student.id)}
      className={`cursor-pointer border-b border-gray-100 transition-colors ${
        selected ? "bg-blue-50" : "hover:bg-gray-50"
      }`}
    >
      <td className="py-2 pl-3 pr-2">
        <span
          title={meta.hint}
          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-bold ${BADGE_CLASS[student.badge]}`}
        >
          <span aria-hidden>{meta.emoji}</span>
          {meta.label}
        </span>
      </td>
      <td className="whitespace-nowrap px-2 py-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(student.id);
          }}
          className={`text-lg font-bold tabular-nums ${calm ? "text-gray-500" : "text-gray-900"}`}
        >
          {student.number}번
          {student.name && <span className="ml-1.5 font-semibold">{student.name}</span>}
        </button>
      </td>
      {PARTS.map((p) => (
        <td key={p.part} className="px-2 py-2">
          <div className="flex items-center gap-1">
            {p.items.map((it) => {
              const a = byItem.get(it.id);
              const kind = dotKind(a?.status);
              const current = it.id === student.currentItemId;
              return (
                <span
                  key={it.id}
                  title={itemLabel(it.id)}
                  className={`h-3 w-3 rounded-full ${DOT_CLASS[kind]} ${
                    current ? "ring-2 ring-blue-500 ring-offset-1" : ""
                  } ${a?.checked ? "opacity-40" : ""}`}
                />
              );
            })}
          </div>
        </td>
      ))}
      <td className="whitespace-nowrap py-2 pl-2 pr-3 text-sm tabular-nums text-gray-500">
        {nowText(student)}
      </td>
    </tr>
  );
}
