"use client";

import { BADGE_META } from "@/lib/hoeung/badge";
import type { DashStudent } from "@/lib/hoeung/dashboard";
import {
  DOT_CLASS,
  PARTS,
  STATUS_LABEL,
  answerText,
  correctText,
  dotKind,
  itemText,
  type AttemptStatus,
} from "@/lib/hoeung/items";

function timeText(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

interface Props {
  student: DashStudent;
  onClose: () => void;
}

/** 우측 상세 패널 — 한 학생의 전체 문항 (낸 답/정답/시도 횟수/시각). PART4 제출문은 여기서 읽는다 */
export default function StudentDetail({ student, onClose }: Props) {
  const byItem = new Map(student.attempts.map((a) => [a.itemId, a]));
  const meta = BADGE_META[student.badge];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{student.number}번</h2>
          <p className="text-sm text-gray-500">
            {meta.emoji} {meta.label}
            {meta.hint ? ` — ${meta.hint}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
        >
          닫기
        </button>
      </div>

      <div className="max-h-[70vh] space-y-5 overflow-y-auto px-4 py-4">
        {PARTS.map((p) => (
          <section key={p.part}>
            <h3 className="mb-2 text-sm font-bold text-gray-700">
              PART {p.part} · {p.title}
            </h3>
            <ol className="space-y-2">
              {p.items.map((it, i) => {
                const a = byItem.get(it.id);
                const current = it.id === student.currentItemId;
                return (
                  <li
                    key={it.id}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      current ? "border-blue-500" : "border-gray-100"
                    } ${a ? "" : "text-gray-400"}`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${DOT_CLASS[dotKind(a?.status)]}`}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-500">{itemText(it)}</p>
                        {a ? (
                          <>
                            <p className="mt-1 break-words text-base font-semibold text-gray-900">
                              {answerText(it, a.answer)}
                            </p>
                            {it.part !== 4 && (
                              <p className="mt-0.5 text-gray-500">정답: {correctText(it)}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-400">
                              {STATUS_LABEL[a.status as AttemptStatus] ?? a.status} · 시도{" "}
                              {a.tries}번 · {timeText(a.updatedAt)}
                              {a.checked ? " · ✔ 확인함" : ""}
                            </p>
                          </>
                        ) : (
                          current && <p className="mt-1 text-xs text-gray-500">지금 푸는 중</p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
