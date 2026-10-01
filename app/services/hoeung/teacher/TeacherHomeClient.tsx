"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addMyRoom, removeMyRoom, useMyRooms } from "@/lib/hoeung/teacher-rooms";

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

export default function TeacherHomeClient() {
  const router = useRouter();
  const rooms = useMyRooms();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/hoeung/rooms", { method: "POST" });
      if (!res.ok) throw new Error();
      const { code, teacherKey } = (await res.json()) as { code: string; teacherKey: string };
      addMyRoom({ code, teacherKey, createdAt: Date.now() });
      router.push(`/services/hoeung/teacher/${code}?k=${teacherKey}`);
    } catch {
      setError("방을 만들지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <button
          type="button"
          onClick={create}
          disabled={busy}
          className="min-h-16 w-full rounded-2xl bg-amber-500 px-6 text-xl font-bold text-white transition-colors hover:bg-amber-600 disabled:bg-gray-300"
        >
          {busy ? "만드는 중…" : "새 방 만들기"}
        </button>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          4자리 방 코드가 만들어집니다. 학생은 코드와 번호, 이름만 쓰고 들어옵니다.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}
      </div>

      {rooms.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-gray-700">이 기기에서 만든 방</h2>
          <ul className="divide-y divide-gray-100">
            {rooms.map((r) => (
              <li key={r.code} className="flex items-center justify-between gap-3 py-2.5">
                <Link
                  href={`/services/hoeung/teacher/${r.code}?k=${r.teacherKey}`}
                  className="flex items-baseline gap-3 hover:opacity-70"
                >
                  <span className="font-mono text-xl font-bold tracking-widest text-gray-900">
                    {r.code}
                  </span>
                  <span className="text-sm text-gray-500">{formatDate(r.createdAt)}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => removeMyRoom(r.code)}
                  className="text-xs text-gray-400 hover:text-gray-700"
                  title="목록에서만 지웁니다 (방과 기록은 그대로)"
                >
                  목록에서 지우기
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
