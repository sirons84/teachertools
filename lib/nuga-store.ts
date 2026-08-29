"use client";

/**
 * 음성 누가기록 저장소 — localStorage 를 외부 스토어로 다룬다.
 * useEffect 안에서 setState 하지 않도록 useSyncExternalStore 를 쓴다.
 * (서버 스냅샷은 항상 빈 상태 → 하이드레이션 불일치 없음)
 */

import { useSyncExternalStore } from "react";
import { RECORDS_KEY, ROSTER_KEY, type NugaRecord, type RosterEntry } from "./nuga";

export interface NugaState {
  roster: RosterEntry[];
  records: NugaRecord[];
  /** localStorage 를 한 번이라도 읽었는지 */
  loaded: boolean;
}

const EMPTY: NugaState = { roster: [], records: [], loaded: false };

let snapshot: NugaState = EMPTY;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    // 손상된 저장소는 빈 상태로 취급 (기존 데이터는 덮어쓰지 않음)
    return [];
  }
}

function readAll(): NugaState {
  return {
    roster: readArray<RosterEntry>(ROSTER_KEY),
    records: readArray<NugaRecord>(RECORDS_KEY),
    loaded: true,
  };
}

function subscribe(listener: () => void): () => void {
  if (!snapshot.loaded) {
    // 첫 구독 시점에 로드 — React 가 구독 직후 스냅샷을 다시 확인하고 한 번 렌더한다
    snapshot = readAll();
  }
  listeners.add(listener);

  const onStorage = (e: StorageEvent) => {
    if (e.key === ROSTER_KEY || e.key === RECORDS_KEY) {
      snapshot = readAll();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => EMPTY;

export function useNugaState(): NugaState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** @returns 저장 성공 여부 (실패 시 화면 상태도 되돌리지 않음 — 호출부에서 안내) */
export function saveRoster(roster: RosterEntry[]): boolean {
  const ok = write(ROSTER_KEY, roster);
  snapshot = { ...snapshot, roster, loaded: true };
  emit();
  return ok;
}

export function saveRecords(records: NugaRecord[]): boolean {
  const ok = write(RECORDS_KEY, records);
  snapshot = { ...snapshot, records, loaded: true };
  emit();
  return ok;
}
