"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import JoinQr from "@/components/hoeung/JoinQr";
import StudentDetail from "@/components/hoeung/StudentDetail";
import StudentRow from "@/components/hoeung/StudentRow";
import type { DashboardData } from "@/lib/hoeung/dashboard";
import { PARTS } from "@/lib/hoeung/items";
import { removeMyRoom } from "@/lib/hoeung/teacher-rooms";

const TEACHER_HOME = "/services/hoeung/teacher";

class HttpError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
  }
}

async function fetcher(url: string): Promise<DashboardData> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new HttpError(res.status);
  return res.json();
}

const buttonClass =
  "inline-flex min-h-10 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50";

export default function DashboardClient({
  code,
  initialKey,
}: {
  code: string;
  initialKey: string | null;
}) {
  const router = useRouter();
  const query = initialKey ? `?k=${encodeURIComponent(initialKey)}` : "";
  const api = `/api/hoeung/rooms/${code}`;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  // null = 자동 (학생이 아직 없으면 펼침)
  const [joinOpen, setJoinOpen] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // SWR 3초 폴링 (padlet BoardClient 와 같은 패턴)
  const { data, error } = useSWR<DashboardData, HttpError>(`${api}/dashboard${query}`, fetcher, {
    refreshInterval: deleting ? 0 : 3000,
    revalidateOnFocus: true,
  });

  // `?k=` 로 들어와 쿠키가 구워졌으면 주소창에서 키를 지운다 (화면 공유 중 노출 방지)
  const authorized = data !== undefined;
  useEffect(() => {
    if (authorized && initialKey) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [authorized, initialKey]);

  if (!data) {
    if (error) {
      return (
        <div className="py-20 text-center">
          <p className="text-gray-600">
            {error.status === 404
              ? "방을 찾을 수 없습니다. 삭제된 방일 수 있습니다."
              : error.status === 401
                ? "교사용 주소(?k=…)로 다시 들어와 주세요."
                : "불러오지 못했습니다. 잠시 뒤 자동으로 다시 시도합니다."}
          </p>
          <Link href={TEACHER_HOME} className="mt-4 inline-block text-sm font-semibold underline">
            방 만들기 화면으로
          </Link>
        </div>
      );
    }
    return <div className="py-20 text-center text-sm text-gray-400">불러오는 중…</div>;
  }

  const { students, summary, teacherKey } = data;
  const selected = students.find((s) => s.id === selectedId) ?? null;
  const showJoin = joinOpen ?? students.length === 0;
  const keyQuery = `?k=${encodeURIComponent(teacherKey)}`;

  const copyTeacherUrl = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/services/hoeung/teacher/${code}${keyQuery}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드를 못 쓰는 환경 — 무시
    }
  };

  const deleteRoom = async () => {
    if (
      !window.confirm(
        "방과 모든 풀이 기록을 삭제합니다. 되돌릴 수 없습니다.\n필요하면 먼저 CSV로 내보내세요. 삭제할까요?"
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`${api}${keyQuery}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      removeMyRoom(code);
      router.push(TEACHER_HOME);
    } catch {
      setDeleting(false);
      alert("삭제하지 못했습니다. 다시 시도해 주세요.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6">
      {/* 제목 + 버튼 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#1E293B]">✏️ {data.room.title}</h1>
          <span className="rounded-lg bg-gray-900 px-3 py-1 font-mono text-xl font-bold tracking-widest text-white">
            {code}
          </span>
          <span className="text-sm text-gray-500">{summary.studentCount}명 입장</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setJoinOpen(!showJoin)} className={buttonClass}>
            {showJoin ? "입장 안내 접기" : "입장 코드·QR"}
          </button>
          <a
            href={`/services/hoeung/teacher/${code}/tv`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass}
          >
            TV 화면 열기
          </a>
          <a href={`${api}/export.csv${keyQuery}`} className={buttonClass}>
            CSV 내보내기
          </a>
          <button type="button" onClick={copyTeacherUrl} className={buttonClass}>
            {copied ? "복사됨 ✓" : "교사용 주소 복사"}
          </button>
          <button
            type="button"
            onClick={deleteRoom}
            disabled={deleting}
            className={`${buttonClass} text-red-600`}
          >
            방 닫기(삭제)
          </button>
        </div>
      </div>

      {/* 학생 입장용 큰 코드 + QR */}
      {showJoin && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-8 rounded-2xl border border-gray-200 bg-white p-6">
          <JoinQr code={code} size={200} />
          <div className="text-center">
            <p className="text-sm text-gray-500">QR을 찍거나, 입장 화면에서 방 코드를 써요</p>
            <p className="mt-1 font-mono text-7xl font-bold tracking-[0.2em] text-gray-900">
              {code}
            </p>
            <p className="mt-2 text-sm text-gray-400">티처툴즈 → 문장 호응 체크</p>
          </div>
        </div>
      )}

      {/* 상단 요약 */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-xs font-bold text-gray-500">PART별 완료 인원</h2>
          <div className="space-y-1.5">
            {summary.partDone.map((p) => (
              <div key={p.part} className="flex items-center gap-2 text-sm">
                <span className="w-14 shrink-0 font-semibold text-gray-600">PART {p.part}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gray-500"
                    style={{
                      width: `${summary.studentCount ? (p.done / summary.studentCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right tabular-nums text-gray-500">
                  {p.done}/{summary.studentCount}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-xs font-bold text-gray-500">전체 평균 진행</h2>
          <p className="text-3xl font-bold tabular-nums text-gray-800">
            {summary.avgPassed}
            <span className="ml-1 text-base font-semibold text-gray-400">
              / {summary.totalItems} 문항
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            PART3까지 {PARTS.slice(0, 3).reduce((n, p) => n + p.items.length, 0)}문항
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-xs font-bold text-gray-500">많이 틀린 문항 Top 3</h2>
          {summary.wrongTop.length === 0 ? (
            <p className="text-sm text-gray-400">아직 없습니다</p>
          ) : (
            <ol className="space-y-1.5 text-sm">
              {summary.wrongTop.map((w) => (
                <li key={w.itemId} className="flex items-baseline gap-2">
                  <span className="shrink-0 font-semibold text-gray-700">{w.label}</span>
                  <span className="min-w-0 flex-1 truncate text-gray-500" title={w.text}>
                    {w.text}
                  </span>
                  <span className="shrink-0 tabular-nums text-gray-700">
                    {w.wrong}/{w.attempted}명 ({Math.round((w.wrong / w.attempted) * 100)}%)
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* 격자: 행 = 학생, 열 = PART1~4. 맨 위 학생이 지금 가야 할 학생 */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          {students.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">
              아직 들어온 학생이 없습니다. 학생이 입장하면 여기에 나타납니다.
            </p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-400">
                  <th className="py-2 pl-3 pr-2 font-semibold">상태</th>
                  <th className="px-2 py-2 font-semibold">번호</th>
                  {PARTS.map((p) => (
                    <th key={p.part} className="px-2 py-2 font-semibold">
                      PART {p.part}
                    </th>
                  ))}
                  <th className="py-2 pl-2 pr-3 font-semibold">지금</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <StudentRow
                    key={s.id}
                    student={s}
                    selected={s.id === selectedId}
                    onSelect={setSelectedId}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selected ? (
          <StudentDetail student={selected} onClose={() => setSelectedId(null)} />
        ) : (
          <div className="hidden rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 lg:block">
            학생 행을 누르면 낸 답과 정답, PART4에서 쓴 문장을 볼 수 있습니다.
            <div className="mt-4 space-y-1 text-left text-xs leading-relaxed">
              <p>🔴 막힘 — 같은 문항에 2분 넘게 있음</p>
              <p>🟠 두 번 틀림 — 정답을 본 문항이 있음</p>
              <p>🟡 확인 필요 — PART3 답을 봐 주세요</p>
              <p>⚪ 신호 없음 — 1분 넘게 패드 신호 없음</p>
              <p>
                🟠·🟡는 학생 패드에서 「선생님과 확인했어요」를 누르면 사라집니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
