"use client";

import { useMemo, useState } from "react";
import {
  filterByPeriod,
  formatDateLabel,
  localDate,
  toCsv,
  type NugaRecord,
  type Period,
  type RosterEntry,
} from "@/lib/nuga";

interface Props {
  roster: RosterEntry[];
  records: NugaRecord[];
  onOpenStudent: (no: number) => void;
  onEditRoster: () => void;
  onClearAll: () => void;
}

const PERIODS: Array<{ key: Period; label: string }> = [
  { key: "week", label: "이번 주" },
  { key: "month", label: "이번 달" },
  { key: "all", label: "전체" },
];

export default function Overview({
  roster,
  records,
  onOpenStudent,
  onEditRoster,
  onClearAll,
}: Props) {
  const [period, setPeriod] = useState<Period>("week");

  const filtered = useMemo(() => filterByPeriod(records, period), [records, period]);

  const grouped = useMemo(() => {
    const byNo = new Map<number, NugaRecord[]>();
    for (const r of filtered) {
      const list = byNo.get(r.no) ?? [];
      list.push(r);
      byNo.set(r.no, list);
    }
    for (const list of byNo.values()) list.sort((a, b) => b.createdAt - a.createdAt);
    return roster.map((s) => ({ student: s, items: byNo.get(s.no) ?? [] }));
  }, [filtered, roster]);

  const missing = grouped.filter((g) => g.items.length === 0).length;

  const exportCsv = () => {
    const csv = toCsv(filtered, roster);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `누가기록_${period}_${localDate()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-10">
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-2 text-sm font-semibold transition-colors ${
                period === p.key ? "bg-rose-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 text-sm font-semibold hover:bg-rose-50 disabled:opacity-40"
        >
          ⬇ CSV 내보내기
        </button>
        <span className="text-sm text-gray-500">
          {filtered.length}건 · 미기록 {missing}명
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {grouped.map(({ student, items }) => (
          <li
            key={student.no}
            className={`rounded-2xl border p-3 ${
              items.length ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"
            }`}
          >
            <button
              type="button"
              onClick={() => onOpenStudent(student.no)}
              className="flex items-center gap-2 text-left"
            >
              <span
                className={`text-sm font-bold ${items.length ? "text-[#1E293B]" : "text-gray-400"}`}
              >
                {student.no}번 {student.name}
              </span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                  items.length ? "bg-rose-100 text-rose-700" : "bg-gray-200 text-gray-500"
                }`}
              >
                {items.length}건
              </span>
            </button>

            {items.length > 0 && (
              <ul className="mt-2 space-y-1">
                {items.map((r) => (
                  <li key={r.id} className="text-sm text-gray-700 leading-relaxed">
                    <span className="text-xs text-gray-400 mr-1.5">{formatDateLabel(r.date)}</span>
                    {r.text}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      {/* ── 설정 ─────────────────────────────── */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-4">
        <h3 className="font-bold text-[#1E293B] text-sm">설정</h3>
        <p className="mt-1 text-xs text-gray-500 leading-relaxed">
          명단과 기록은 이 브라우저에만 저장됩니다. 기기를 바꾸기 전에 CSV로 먼저 내보내세요.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEditRoster}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            명단 수정
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  "모든 기록을 삭제합니다. 되돌릴 수 없어요.\nCSV로 내보냈는지 확인했나요?"
                )
              ) {
                onClearAll();
              }
            }}
            className="px-3 py-2 rounded-xl border border-rose-200 text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            전체 기록 삭제
          </button>
        </div>
      </div>
    </div>
  );
}
