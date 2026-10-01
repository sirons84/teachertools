/**
 * 문장 호응 체크 — 교사 대시보드 / TV 화면 집계 (순수 함수).
 * 뱃지 계산을 포함해 서버에서 한 번에 만든다.
 */

import { BADGE_ORDER, IDLE_MS, computeBadge, msOnCurrentItem, type Badge } from "./badge";
import {
  ALL_ITEMS,
  PARTS,
  TOTAL_ITEMS,
  getItem,
  isPassed,
  itemLabel,
  itemText,
  type Part,
} from "./items";

/** DB 에서 읽은 그대로의 모양 */
export interface StudentRecord {
  id: string;
  number: number;
  name: string;
  currentItemId: string | null;
  currentItemSince: Date;
  lastActiveAt: Date;
  attempts: {
    itemId: string;
    part: number;
    answer: string;
    status: string;
    tries: number;
    checked: boolean;
    updatedAt: Date;
  }[];
}

export interface DashAttempt {
  itemId: string;
  part: number;
  answer: string;
  status: string;
  tries: number;
  checked: boolean;
  updatedAt: string;
}

export interface DashStudent {
  id: string;
  number: number;
  /** 입장할 때 쓴 이름 (예전 방의 기록에는 비어 있을 수 있다) */
  name: string;
  badge: Badge;
  currentItemId: string | null;
  /** 현재 문항에서 흐른 시간(초). 현재 문항이 없으면 null */
  secondsOnItem: number | null;
  /** 마지막 신호 뒤 흐른 시간(초) */
  secondsSinceActive: number;
  /** 지나간 문항 수 */
  passedCount: number;
  attempts: DashAttempt[];
}

export interface DashSummary {
  studentCount: number;
  totalItems: number;
  /** 학생 1인당 평균 진행 문항 */
  avgPassed: number;
  /** PART별로 모든 문항을 지나간 학생 수 */
  partDone: { part: Part; title: string; done: number }[];
  wrongTop: {
    itemId: string;
    label: string;
    text: string;
    wrong: number;
    attempted: number;
  }[];
}

export interface DashboardData {
  room: { code: string; title: string; createdAt: string };
  teacherKey: string;
  students: DashStudent[];
  summary: DashSummary;
}

export interface TvData {
  code: string;
  title: string;
  studentCount: number;
  /** 모든 문항을 지나간 학생 수 */
  finishedCount: number;
  parts: {
    part: Part;
    title: string;
    /** 반 전체 진행률 0~100 */
    percent: number;
    /** 이 PART를 끝낸 인원 */
    doneCount: number;
    /** 지금 이 PART를 풀고 있는 인원 */
    hereCount: number;
  }[];
}

/** 문항 JSON 에서 사라진 문항의 기록은 집계에서 뺀다 */
function knownAttempts(s: StudentRecord) {
  return s.attempts.filter((a) => getItem(a.itemId));
}

function partsDone(passedIds: Set<string>): boolean[] {
  return PARTS.map((p) => p.items.every((it) => passedIds.has(it.id)));
}

/** 처음부터 맞히지 못한 기록인지 (오답률 집계용) */
function wasWrong(a: { status: string; tries: number }): boolean {
  return a.tries > 1 || a.status === "wrong" || a.status === "revealed" || a.status === "needs-check";
}

export function buildDashboardStudents(records: StudentRecord[], now: number): DashStudent[] {
  const students = records.map((s): DashStudent => {
    const attempts = knownAttempts(s);
    const badgeInput = {
      now,
      lastActiveAt: s.lastActiveAt.getTime(),
      currentItemId: getItem(s.currentItemId) ? s.currentItemId : null,
      currentItemSince: s.currentItemSince.getTime(),
      attempts: attempts.map((a) => ({
        itemId: a.itemId,
        status: a.status,
        checked: a.checked,
        updatedAt: a.updatedAt.getTime(),
      })),
    };
    const onItem = msOnCurrentItem(badgeInput);
    return {
      id: s.id,
      number: s.number,
      name: s.name,
      badge: computeBadge(badgeInput),
      currentItemId: badgeInput.currentItemId,
      secondsOnItem: onItem === null ? null : Math.floor(onItem / 1000),
      secondsSinceActive: Math.max(0, Math.floor((now - s.lastActiveAt.getTime()) / 1000)),
      passedCount: attempts.filter((a) => isPassed(a.status)).length,
      attempts: attempts.map((a) => ({
        itemId: a.itemId,
        part: a.part,
        answer: a.answer,
        status: a.status,
        tries: a.tries,
        checked: a.checked,
        updatedAt: a.updatedAt.toISOString(),
      })),
    };
  });

  // 뱃지 우선순위 → 번호
  students.sort(
    (a, b) =>
      BADGE_ORDER.indexOf(a.badge) - BADGE_ORDER.indexOf(b.badge) || a.number - b.number
  );
  return students;
}

export function buildSummary(records: StudentRecord[]): DashSummary {
  const studentCount = records.length;
  const done = PARTS.map(() => 0);
  let passedTotal = 0;
  const perItem = new Map<string, { wrong: number; attempted: number }>();

  for (const s of records) {
    const attempts = knownAttempts(s);
    const passedIds = new Set(attempts.filter((a) => isPassed(a.status)).map((a) => a.itemId));
    passedTotal += passedIds.size;
    partsDone(passedIds).forEach((d, i) => {
      if (d) done[i] += 1;
    });
    for (const a of attempts) {
      if (a.part === 4) continue; // 채점 없음
      const row = perItem.get(a.itemId) ?? { wrong: 0, attempted: 0 };
      row.attempted += 1;
      if (wasWrong(a)) row.wrong += 1;
      perItem.set(a.itemId, row);
    }
  }

  // 한두 명만 푼 문항이 100%로 맨 위에 오지 않도록, 반의 1/4 이상이 푼 문항만 본다
  const minAttempted = Math.max(1, Math.ceil(studentCount / 4));
  const wrongTop = ALL_ITEMS.flatMap((it) => {
    const row = perItem.get(it.id);
    if (!row || row.wrong === 0 || row.attempted < minAttempted) return [];
    return [{ itemId: it.id, label: itemLabel(it.id), text: itemText(it), ...row }];
  })
    .sort((a, b) => b.wrong / b.attempted - a.wrong / a.attempted || b.wrong - a.wrong)
    .slice(0, 3);

  return {
    studentCount,
    totalItems: TOTAL_ITEMS,
    avgPassed: studentCount ? Math.round((passedTotal / studentCount) * 10) / 10 : 0,
    partDone: PARTS.map((p, i) => ({ part: p.part, title: p.title, done: done[i] })),
    wrongTop,
  };
}

/** TV 화면용 — 번호·이름·답 없이 반 전체 숫자만 (익명) */
export function buildTv(
  room: { code: string; title: string },
  records: StudentRecord[],
  now: number
): TvData {
  const studentCount = records.length;
  const passedPerPart = PARTS.map(() => 0);
  const doneCount = PARTS.map(() => 0);
  const hereCount = PARTS.map(() => 0);
  let finishedCount = 0;

  for (const s of records) {
    const passedIds = new Set(
      knownAttempts(s)
        .filter((a) => isPassed(a.status))
        .map((a) => a.itemId)
    );
    const done = partsDone(passedIds);
    PARTS.forEach((p, i) => {
      passedPerPart[i] += p.items.filter((it) => passedIds.has(it.id)).length;
      if (done[i]) doneCount[i] += 1;
    });
    if (done.every(Boolean)) finishedCount += 1;
    // "지금 푸는 인원"은 패드 신호가 살아 있는 학생만 센다
    const current = getItem(s.currentItemId);
    if (current && now - s.lastActiveAt.getTime() < IDLE_MS) hereCount[current.part - 1] += 1;
  }

  return {
    code: room.code,
    title: room.title,
    studentCount,
    finishedCount,
    parts: PARTS.map((p, i) => ({
      part: p.part,
      title: p.title,
      percent: studentCount
        ? Math.round((passedPerPart[i] / (studentCount * p.items.length)) * 100)
        : 0,
      doneCount: doneCount[i],
      hereCount: hereCount[i],
    })),
  };
}
