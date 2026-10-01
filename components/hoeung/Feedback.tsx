import type { ReactNode } from "react";

type Tone = "good" | "revealed" | "check" | "hint";

const TONE: Record<Tone, string> = {
  good: "border-green-500 bg-green-50",
  revealed: "border-orange-500 bg-orange-50",
  check: "border-yellow-400 bg-yellow-50",
  hint: "border-gray-300 bg-gray-50",
};

/** 풀이 화면의 피드백 상자. 색은 상태 색만 쓴다 */
export function Feedback({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <div
      role="status"
      className={`rounded-2xl border-2 px-5 py-4 text-[22px] leading-relaxed text-gray-800 ${TONE[tone]}`}
    >
      {children}
    </div>
  );
}

/** "내 답 / 정답 / 힌트" 한 줄 */
export function InfoLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="text-xl leading-relaxed text-gray-800">
      <span className="mr-2 inline-block min-w-16 text-base font-semibold text-gray-500">
        {label}
      </span>
      {children}
    </p>
  );
}

/** 보조 버튼 (다시 풀기 등) */
export function GhostButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-14 rounded-2xl border-2 border-gray-300 bg-white px-6 text-xl font-semibold text-gray-700 active:bg-gray-100"
    >
      {children}
    </button>
  );
}
