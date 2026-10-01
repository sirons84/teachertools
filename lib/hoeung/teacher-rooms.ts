"use client";

/**
 * 문장 호응 체크 — 이 기기에서 만든 방 목록 (localStorage).
 * 수업 전에 방을 만들어 두고 나중에 다시 찾아 들어오기 위한 것. 서버에는 목록이 없다.
 */

import { useSyncExternalStore } from "react";

const KEY = "hoeung.teacher.rooms.v1";
const MAX_ROOMS = 20;

export interface MyRoom {
  code: string;
  teacherKey: string;
  /** epoch ms */
  createdAt: number;
}

const EMPTY: MyRoom[] = [];
let cachedRaw: string | null = null;
let cachedRooms: MyRoom[] = EMPTY;
const listeners = new Set<() => void>();

function read(): MyRoom[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  // 같은 내용이면 같은 배열을 돌려준다 (useSyncExternalStore 스냅샷 안정성)
  if (raw === cachedRaw) return cachedRooms;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedRooms = Array.isArray(parsed) ? (parsed as MyRoom[]) : EMPTY;
  } catch {
    cachedRooms = EMPTY;
  }
  return cachedRooms;
}

function write(rooms: MyRoom[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rooms));
  } catch {
    // 저장소를 못 써도 방 자체는 쿠키로 접근할 수 있다
  }
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useMyRooms(): MyRoom[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function addMyRoom(room: MyRoom) {
  write([room, ...read().filter((r) => r.code !== room.code)].slice(0, MAX_ROOMS));
}

export function removeMyRoom(code: string) {
  write(read().filter((r) => r.code !== code));
}
