/**
 * 문장 호응 체크 — 교사 대시보드 상태 뱃지 (서버·클라이언트 공용, 순수 함수).
 * 우선순위 순으로 하나만 붙는다. 맨 위 학생이 "지금 가야 할 학생".
 */

export type Badge = "STUCK" | "WRONG2" | "CHECK" | "IDLE" | "OK";

/** 정렬용 우선순위 (앞일수록 먼저) */
export const BADGE_ORDER: Badge[] = ["STUCK", "WRONG2", "CHECK", "IDLE", "OK"];

/** 같은 문항에 이만큼 머물면 STUCK */
export const STUCK_MS = 120_000;
/** heartbeat 가 이만큼 없으면 IDLE (패드 꺼짐/이탈) */
export const IDLE_MS = 60_000;

export interface BadgeAttempt {
  itemId: string;
  status: string;
  checked: boolean;
  /** epoch ms */
  updatedAt: number;
}

export interface BadgeInput {
  /** epoch ms */
  now: number;
  /** 마지막 heartbeat/제출 시각 */
  lastActiveAt: number;
  currentItemId: string | null;
  /** 현재 문항에 들어온 시각 */
  currentItemSince: number;
  attempts: BadgeAttempt[];
}

/** 현재 문항에서 마지막으로 무언가 한 뒤 흐른 시간(ms). 현재 문항이 없으면 null */
export function msOnCurrentItem(input: BadgeInput): number | null {
  if (!input.currentItemId) return null;
  const own = input.attempts.find((a) => a.itemId === input.currentItemId);
  const since = Math.max(input.currentItemSince, own?.updatedAt ?? 0);
  return Math.max(0, input.now - since);
}

export function computeBadge(input: BadgeInput): Badge {
  const alive = input.now - input.lastActiveAt < IDLE_MS;

  // 패드가 꺼진 학생은 "막힘"이 아니라 "이탈"로 본다 (끝내고 덮은 패드가 계속 빨갛게 남지 않도록)
  const onItem = msOnCurrentItem(input);
  if (alive && onItem !== null && onItem >= STUCK_MS) return "STUCK";

  if (input.attempts.some((a) => a.status === "revealed" && !a.checked)) return "WRONG2";
  if (input.attempts.some((a) => a.status === "needs-check" && !a.checked)) return "CHECK";
  if (!alive) return "IDLE";
  return "OK";
}

export const BADGE_META: Record<Badge, { emoji: string; label: string; hint: string }> = {
  STUCK: { emoji: "🔴", label: "막힘", hint: "같은 문항에 2분 넘게 머물러 있어요" },
  WRONG2: { emoji: "🟠", label: "두 번 틀림", hint: "두 번 틀려 정답을 본 문항이 있어요" },
  CHECK: { emoji: "🟡", label: "확인 필요", hint: "PART3 답을 선생님이 봐 주세요" },
  IDLE: { emoji: "⚪", label: "신호 없음", hint: "1분 넘게 패드 신호가 없어요" },
  OK: { emoji: "🟢", label: "정상", hint: "" },
};
