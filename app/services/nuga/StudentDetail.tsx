"use client";

import { useMemo, useState } from "react";
import { formatDateLabel, type NugaRecord, type RosterEntry } from "@/lib/nuga";

interface Props {
  student: RosterEntry;
  records: NugaRecord[];
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export default function StudentDetail({ student, records, onUpdate, onDelete, onBack }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const mine = useMemo(
    () =>
      records
        .filter((r) => r.no === student.no)
        .sort((a, b) => b.createdAt - a.createdAt),
    [records, student.no]
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-10">
      <button
        type="button"
        onClick={onBack}
        className="mt-1 text-sm text-gray-500 hover:text-gray-700"
      >
        ← 기록 화면으로
      </button>

      <div className="mt-3 flex items-baseline gap-2">
        <h2 className="text-xl font-bold text-[#1E293B]">
          {student.no}번 {student.name}
        </h2>
        <span className="text-sm text-gray-500">전체 {mine.length}건</span>
      </div>

      {mine.length === 0 ? (
        <p className="mt-8 text-center text-sm text-gray-400">아직 기록이 없습니다.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {mine.map((r) => (
            <li key={r.id} className="rounded-2xl border border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-600">
                  {formatDateLabel(r.date)}
                </span>
                {editingId !== r.id && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(r.id);
                        setEditText(r.text);
                      }}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("이 기록을 삭제할까요?")) onDelete(r.id);
                      }}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-rose-600 hover:bg-rose-50"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>

              {editingId === r.id ? (
                <div className="mt-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={!editText.trim()}
                      onClick={() => {
                        onUpdate(r.id, editText.trim());
                        setEditingId(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-sm font-semibold disabled:bg-gray-200 disabled:text-gray-400"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-sm text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                  {r.text}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
