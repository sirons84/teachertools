"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PartTabs, { type PartTab } from "@/components/hoeung/PartTabs";
import ProgressStrip from "@/components/hoeung/ProgressStrip";
import Part1Chips from "@/components/hoeung/Part1Chips";
import Part2Choice from "@/components/hoeung/Part2Choice";
import Part3Blank from "@/components/hoeung/Part3Blank";
import Part4Free from "@/components/hoeung/Part4Free";
import {
  ALL_ITEMS,
  PARTS,
  getItem,
  getPart,
  isPassed,
  itemOrder,
  type AttemptStatus,
  type HoeungItem,
  type Part,
} from "@/lib/hoeung/items";
import {
  flushQueue,
  getHoeungState,
  markChecked,
  recordAttempt,
  sendHeartbeat,
  setCurrentItem,
  useHoeungState,
  type LocalAttempt,
} from "@/lib/hoeung/store";

const HEARTBEAT_MS = 15_000;

type Attempts = Record<string, LocalAttempt>;

/** 앞 PART를 모두 지나갔으면 열린다 */
function isUnlocked(part: Part, attempts: Attempts): boolean {
  return PARTS.filter((p) => p.part < part).every((p) =>
    p.items.every((it) => isPassed(attempts[it.id]?.status))
  );
}

function firstUnpassed(items: HoeungItem[], attempts: Attempts, skipId?: string) {
  return items.find((it) => it.id !== skipId && !isPassed(attempts[it.id]?.status));
}

/**
 * 「다음」이 갈 곳: 같은 PART의 뒤쪽 안 푼 문항 → 같은 PART의 남은 문항 → 다음 PART.
 * 더 갈 곳이 없으면 null (끝).
 */
function nextItemId(current: HoeungItem, attempts: Attempts): string | null {
  const items = getPart(current.part)?.items ?? [];
  const idx = items.findIndex((it) => it.id === current.id);
  const later = firstUnpassed(items.slice(idx + 1), attempts);
  if (later) return later.id;
  const rest = firstUnpassed(items, attempts, current.id);
  if (rest) return rest.id;
  // 이 PART에 건너뛴 문항이 없을 때만 다음 PART로
  if (isPassed(attempts[current.id]?.status)) {
    for (const p of PARTS) {
      if (p.part <= current.part) continue;
      return (firstUnpassed(p.items, attempts) ?? p.items[0]).id;
    }
  }
  return null;
}

export default function PlayClient() {
  const router = useRouter();
  const { session, attempts, pending, stalled, loaded } = useHoeungState();
  // 이번에 들어와서 방금 푼 문항 — 되돌아온 문항에서만 「선생님과 확인했어요」를 보여 주려고
  const [freshId, setFreshId] = useState<string | null>(null);

  // 입장하지 않고 들어온 경우
  useEffect(() => {
    if (loaded && !session) router.replace("/services/hoeung");
  }, [loaded, session, router]);

  // 보여 줄 문항: 저장된 현재 문항(열린 PART일 때) → 없으면 처음 만나는 안 푼 문항
  const saved = getItem(session?.currentItemId);
  // (안 푼 문항이 하나도 없으면 null → 끝 화면)
  const shown: HoeungItem | null =
    saved && isUnlocked(saved.part, attempts)
      ? saved
      : (firstUnpassed(ALL_ITEMS, attempts) ?? null);
  const shownId = shown?.id ?? null;
  const studentId = session?.studentId ?? null;

  // heartbeat: 문항을 옮길 때 바로 + 15초마다 (화면이 보일 때만). 겸사겸사 밀린 기록도 다시 보낸다
  useEffect(() => {
    if (!studentId) return;
    sendHeartbeat(studentId, shownId);
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      sendHeartbeat(studentId, shownId);
      void flushQueue();
    }, HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [studentId, shownId]);

  const goTo = useCallback((itemId: string | null) => {
    setFreshId(null);
    setCurrentItem(itemId);
    window.scrollTo({ top: 0 });
  }, []);

  const goNext = useCallback(() => {
    if (!shown) return;
    // 방금 기록한 내용까지 반영된 상태로 계산
    goTo(nextItemId(shown, getHoeungState().attempts));
  }, [shown, goTo]);

  const selectPart = useCallback(
    (part: Part) => {
      const items = getPart(part)?.items ?? [];
      const target = firstUnpassed(items, attempts) ?? items[0];
      if (target) goTo(target.id);
    },
    [attempts, goTo]
  );

  if (!loaded || !session) {
    return <div className="py-20 text-center text-lg text-gray-400">불러오는 중…</div>;
  }

  const activePart: Part = shown?.part ?? 4;
  const partInfo = getPart(activePart);
  const tabs: PartTab[] = PARTS.map((p) => ({
    part: p.part,
    title: p.title,
    unlocked: isUnlocked(p.part, attempts),
    done: p.items.every((it) => isPassed(attempts[it.id]?.status)),
  }));

  const attempt = shown ? attempts[shown.id] : undefined;
  const passed = isPassed(attempt?.status);
  const needsTeacher =
    attempt !== undefined && (attempt.status === "revealed" || attempt.status === "needs-check");

  const onRecord = (answer: string, status: AttemptStatus, tries: number) => {
    if (!shown) return;
    setFreshId(shown.id);
    // 저장된 현재 문항이 없을 때(처음 들어온 직후)도 이 문항에 머물도록 고정한다.
    // 안 그러면 "처음 만나는 안 푼 문항"이 바뀌면서 결과 화면을 못 보고 넘어간다
    setCurrentItem(shown.id);
    recordAttempt(shown, answer, status, tries);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* 상단 고정: PART 탭 + 문항 점 띠 */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl space-y-2 px-4 py-2">
          <div className="flex items-center justify-between text-base">
            <span className="font-bold text-gray-900">✏️ 문장 호응 체크</span>
            <span className="flex items-center gap-3">
              {stalled && (
                <span className="text-sm text-gray-400" title="와이파이가 돌아오면 자동으로 보내요">
                  저장 대기 {pending}
                </span>
              )}
              <span className="font-semibold text-gray-700">
                {session.number}번 {session.name}
              </span>
            </span>
          </div>
          <PartTabs tabs={tabs} active={activePart} onSelect={selectPart} />
          <ProgressStrip
            items={partInfo?.items ?? []}
            statusOf={(id) => attempts[id]}
            currentId={shownId}
            onSelect={goTo}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        {shown ? (
          <>
            <p className="mb-5 text-[22px] leading-relaxed text-gray-600">
              <span className="mr-2 font-bold text-gray-900">{itemOrder(shown.id)}.</span>
              {partInfo?.instruction}
            </p>

            {/* key: 문항이 바뀌면 입력 상태를 새로 시작 */}
            {shown.part === 1 && (
              <Part1Chips key={shown.id} item={shown} attempt={attempt} onRecord={onRecord} />
            )}
            {shown.part === 2 && (
              <Part2Choice key={shown.id} item={shown} attempt={attempt} onRecord={onRecord} />
            )}
            {shown.part === 3 && (
              <Part3Blank key={shown.id} item={shown} attempt={attempt} onRecord={onRecord} />
            )}
            {shown.part === 4 && (
              <Part4Free
                key={shown.id}
                item={shown}
                attempt={attempt}
                onRecord={onRecord}
                onNext={goNext}
              />
            )}

            <div className="mt-8 space-y-3">
              {(passed || shown.part === 4) && (
                <button
                  type="button"
                  onClick={goNext}
                  className={`min-h-16 w-full rounded-2xl px-6 text-[22px] font-bold ${
                    passed
                      ? "bg-blue-500 text-white active:bg-blue-600"
                      : "border-2 border-gray-300 bg-white text-gray-600 active:bg-gray-100"
                  }`}
                >
                  {passed ? "다음 →" : "건너뛰기 →"}
                </button>
              )}

              {/* 선생님이 도와준 뒤 학생 패드에서 한 번 눌러 주는 버튼 (되돌아온 문항에서만) */}
              {needsTeacher &&
                (attempt.checked ? (
                  <p className="py-2 text-center text-lg font-semibold text-gray-500">
                    ✔ 선생님과 확인했어요
                  </p>
                ) : (
                  freshId !== shown.id && (
                    <button
                      type="button"
                      onClick={() => markChecked(shown.id)}
                      className="min-h-14 w-full rounded-2xl border-2 border-gray-900 bg-white px-6 text-xl font-bold text-gray-900 active:bg-gray-100"
                    >
                      선생님과 확인했어요 ✔
                    </button>
                  )
                ))}
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <div className="text-6xl">👏</div>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">끝까지 다 했어요!</h1>
            <p className="mt-3 text-[22px] leading-relaxed text-gray-600">
              위의 PART와 번호를 누르면 푼 문제를 다시 볼 수 있어요.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
