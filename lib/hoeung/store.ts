"use client";

/**
 * 문장 호응 체크 학생 저장소 — localStorage 를 외부 스토어로 다룬다 (nuga-store 와 같은 패턴).
 *
 * 모든 입력은 먼저 localStorage 에 쓰고, 서버 전송은 큐에 쌓아 순서대로 보낸다.
 * 전송이 실패하면 큐에 남겨 두었다가 온라인 복귀·주기 재시도 때 다시 보낸다.
 * → 패드 와이파이가 흔들려도 학생은 계속 풀 수 있다.
 *
 * 번호와 이름은 입장할 때 서버에도 저장된다 (교사 대시보드 식별용).
 */

import { useSyncExternalStore } from "react";
import type { AttemptStatus, Part } from "./items";

export const SESSION_KEY = "hoeung.session.v1";
export const ATTEMPTS_KEY = "hoeung.attempts.v1";
export const QUEUE_KEY = "hoeung.queue.v1";

const RETRY_MS = 5000;

export interface HoeungSession {
  code: string;
  number: number;
  name: string;
  studentId: string;
  currentItemId: string | null;
}

export interface LocalAttempt {
  itemId: string;
  part: number;
  /** PART1·2 는 인덱스, PART3·4 는 입력한 글 */
  answer: string;
  status: AttemptStatus;
  tries: number;
  checked: boolean;
  /** epoch ms */
  updatedAt: number;
}

type QueueOp =
  | {
      id: string;
      studentId: string;
      kind: "attempt";
      itemId: string;
      part: number;
      answer: string;
      status: AttemptStatus;
      tries: number;
    }
  | { id: string; studentId: string; kind: "check"; itemId: string };

export interface HoeungState {
  session: HoeungSession | null;
  attempts: Record<string, LocalAttempt>;
  /** 아직 서버에 못 보낸 기록 수 */
  pending: number;
  /** 전송이 실패해 재시도를 기다리는 중인지 (화면에 "저장 대기"를 띄울 때) */
  stalled: boolean;
  /** localStorage 를 한 번이라도 읽었는지 */
  loaded: boolean;
}

const EMPTY: HoeungState = {
  session: null,
  attempts: {},
  pending: 0,
  stalled: false,
  loaded: false,
};

let snapshot: HoeungState = EMPTY;
let queue: QueueOp[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    // 손상된 저장소는 빈 상태로 취급
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장소를 못 써도(시크릿 모드 등) 메모리 상태로 계속 푼다
  }
}

function readAll(): HoeungState {
  const session = readJson<HoeungSession | null>(SESSION_KEY, null);
  const attempts = readJson<Record<string, LocalAttempt>>(ATTEMPTS_KEY, {});
  const q = readJson<QueueOp[]>(QUEUE_KEY, []);
  queue = Array.isArray(q) ? q : [];
  return {
    session: session && typeof session.studentId === "string" ? session : null,
    attempts: Array.isArray(attempts) ? {} : attempts,
    pending: queue.length,
    stalled: false,
    loaded: true,
  };
}

function ensureLoaded() {
  if (!snapshot.loaded && typeof window !== "undefined") snapshot = readAll();
}

function subscribe(listener: () => void): () => void {
  // 첫 구독 시점에 로드 — React 가 구독 직후 스냅샷을 다시 확인하고 한 번 렌더한다
  ensureLoaded();
  listeners.add(listener);

  const onStorage = (e: StorageEvent) => {
    if (e.key === SESSION_KEY || e.key === ATTEMPTS_KEY || e.key === QUEUE_KEY) {
      snapshot = readAll();
      emit();
    }
  };
  const onOnline = () => void flushQueue();
  window.addEventListener("storage", onStorage);
  window.addEventListener("online", onOnline);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("online", onOnline);
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => EMPTY;

export function useHoeungState(): HoeungState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** 이벤트 핸들러에서 방금 기록한 내용까지 반영된 최신 상태가 필요할 때 */
export function getHoeungState(): HoeungState {
  return snapshot;
}

function update(patch: Partial<HoeungState>) {
  snapshot = {
    ...snapshot,
    ...patch,
    pending: queue.length,
    stalled: queue.length > 0 && (patch.stalled ?? snapshot.stalled),
    loaded: true,
  };
  emit();
}

/* ── 세션 ─────────────────────────────────────────── */

/**
 * 입장 직후 호출. 같은 학생으로 다시 들어온 경우 이 기기의 기록을 우선하고
 * (아직 못 보낸 기록이 있을 수 있으므로) 서버 기록은 빈 곳만 채운다.
 */
export function startSession(
  who: { code: string; number: number; name: string },
  joined: {
    studentId: string;
    currentItemId: string | null;
    attempts: LocalAttempt[];
  }
) {
  ensureLoaded();
  const prev = snapshot.session;
  const same = prev !== null && prev.studentId === joined.studentId;

  const attempts: Record<string, LocalAttempt> = {};
  for (const a of joined.attempts) attempts[a.itemId] = a;
  if (same) {
    for (const [id, local] of Object.entries(snapshot.attempts)) {
      attempts[id] = { ...local, checked: local.checked || attempts[id]?.checked === true };
    }
  }

  const session: HoeungSession = {
    ...who,
    studentId: joined.studentId,
    currentItemId: prev !== null && same ? prev.currentItemId : joined.currentItemId,
  };
  write(SESSION_KEY, session);
  write(ATTEMPTS_KEY, attempts);
  update({ session, attempts });
  void flushQueue();
}

/** 다른 번호로 들어가기 — 이 기기의 세션을 지운다 (못 보낸 기록 큐는 남겨 마저 보낸다) */
export function leaveSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(ATTEMPTS_KEY);
  } catch {
    // 무시
  }
  update({ session: null, attempts: {} });
}

export function setCurrentItem(itemId: string | null) {
  const session = snapshot.session;
  if (!session || session.currentItemId === itemId) return;
  const next = { ...session, currentItemId: itemId };
  write(SESSION_KEY, next);
  update({ session: next });
}

/* ── 풀이 기록 ─────────────────────────────────────── */

let opSeq = 0;
function opId(): string {
  opSeq += 1;
  return `${Date.now().toString(36)}-${opSeq}`;
}

function enqueue(op: QueueOp) {
  queue = [...queue, op];
  write(QUEUE_KEY, queue);
}

export function recordAttempt(
  item: { id: string; part: Part },
  answer: string,
  status: AttemptStatus,
  tries: number
) {
  const session = snapshot.session;
  if (!session) return;
  const prev = snapshot.attempts[item.id];
  const attempt: LocalAttempt = {
    itemId: item.id,
    part: item.part,
    answer,
    status,
    tries,
    checked: prev?.checked ?? false,
    updatedAt: Date.now(),
  };
  const attempts = { ...snapshot.attempts, [item.id]: attempt };
  write(ATTEMPTS_KEY, attempts);
  enqueue({
    id: opId(),
    studentId: session.studentId,
    kind: "attempt",
    itemId: item.id,
    part: item.part,
    answer,
    status,
    tries,
  });
  update({ attempts });
  void flushQueue();
}

/** 「선생님과 확인했어요」 */
export function markChecked(itemId: string) {
  const session = snapshot.session;
  const prev = snapshot.attempts[itemId];
  if (!session || !prev || prev.checked) return;
  const attempts = { ...snapshot.attempts, [itemId]: { ...prev, checked: true } };
  write(ATTEMPTS_KEY, attempts);
  enqueue({ id: opId(), studentId: session.studentId, kind: "check", itemId });
  update({ attempts });
  void flushQueue();
}

/* ── 전송 큐 ───────────────────────────────────────── */

let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function send(op: QueueOp): Promise<Response> {
  const base = `/api/hoeung/students/${encodeURIComponent(op.studentId)}/attempts`;
  if (op.kind === "check") {
    return fetch(`${base}/${encodeURIComponent(op.itemId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: true }),
    });
  }
  return fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itemId: op.itemId,
      part: op.part,
      answer: op.answer,
      status: op.status,
      tries: op.tries,
    }),
  });
}

/** 다시 보내도 소용없는 응답인지 (방이 삭제됨, 잘못된 요청 등) */
function isPermanentFailure(status: number): boolean {
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

/** 큐를 앞에서부터 순서대로 보낸다. 실패하면 멈추고 잠시 뒤 다시 시도 */
export async function flushQueue(): Promise<void> {
  ensureLoaded();
  if (flushing) return;
  flushing = true;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  try {
    while (queue.length > 0) {
      const op = queue[0];
      let res: Response;
      try {
        res = await send(op);
      } catch {
        break; // 네트워크 끊김
      }
      if (!res.ok && !isPermanentFailure(res.status)) break;
      queue = queue.filter((q) => q.id !== op.id);
      write(QUEUE_KEY, queue);
      update({});
    }
  } finally {
    flushing = false;
    if (queue.length > 0 && !retryTimer) {
      update({ stalled: true });
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void flushQueue();
      }, RETRY_MS);
    }
  }
}

/** 15초마다 + 문항을 옮길 때. 실패는 무시한다 (다음 번에 다시 감) */
export function sendHeartbeat(studentId: string, currentItemId: string | null) {
  fetch(`/api/hoeung/students/${encodeURIComponent(studentId)}/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentItemId }),
    keepalive: true,
  }).catch(() => {});
}
