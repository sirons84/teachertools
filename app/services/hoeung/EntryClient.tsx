"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CODE_LENGTH,
  MAX_NUMBER,
  MIN_NUMBER,
  isValidNumber,
  isValidRoomCode,
  normalizeRoomCode,
} from "@/lib/hoeung/code";
import { startSession, useHoeungState, type LocalAttempt } from "@/lib/hoeung/store";

const PLAY_PATH = "/services/hoeung/play";

interface JoinResponse {
  studentId: string;
  currentItemId: string | null;
  attempts: LocalAttempt[];
}

export default function EntryClient({ initialCode }: { initialCode: string }) {
  const router = useRouter();
  const { session, loaded } = useHoeungState();
  const [code, setCode] = useState(initialCode);
  const [numberText, setNumberText] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const roomCode = normalizeRoomCode(code);
    const number = Number(numberText);
    const trimmedName = name.trim();
    if (!isValidRoomCode(roomCode)) {
      setError(`방 코드 ${CODE_LENGTH}자리를 다시 확인해 주세요.`);
      return;
    }
    if (!isValidNumber(number)) {
      setError(`번호는 ${MIN_NUMBER}~${MAX_NUMBER} 사이로 써 주세요.`);
      return;
    }
    if (!trimmedName) {
      setError("이름을 써 주세요.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      // 서버로는 번호만 보낸다. 이름은 이 기기에만 남는다
      const res = await fetch(`/api/hoeung/rooms/${encodeURIComponent(roomCode)}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "들어가지 못했어요. 다시 눌러 주세요.");
        return;
      }
      const joined = (await res.json()) as JoinResponse;
      startSession({ code: roomCode, number, name: trimmedName }, joined);
      router.push(PLAY_PATH);
    } catch {
      setError("인터넷 연결을 확인하고 다시 눌러 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border-2 border-gray-300 bg-white px-4 py-3 text-2xl text-gray-900 outline-none focus:border-blue-500";

  return (
    <div className="space-y-6">
      {loaded && session && (
        <div className="rounded-2xl border-2 border-blue-500 bg-white p-5">
          <p className="text-lg text-gray-600">
            <span className="font-mono font-bold tracking-widest text-gray-900">
              {session.code}
            </span>{" "}
            방 · {session.number}번 {session.name}
          </p>
          <button
            type="button"
            onClick={() => router.push(PLAY_PATH)}
            className="mt-3 min-h-14 w-full rounded-2xl bg-blue-500 px-6 text-xl font-bold text-white active:bg-blue-600"
          >
            이어서 풀기 →
          </button>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        {loaded && session && (
          <p className="text-base font-semibold text-gray-500">다른 방·번호로 들어가기</p>
        )}
        <label className="block">
          <span className="mb-1 block text-lg font-semibold text-gray-700">방 코드</span>
          <input
            value={code}
            onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
            maxLength={CODE_LENGTH}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="선생님이 알려 준 4글자"
            className={`${inputClass} font-mono tracking-[0.4em] placeholder:font-sans placeholder:text-lg placeholder:tracking-normal`}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-lg font-semibold text-gray-700">번호</span>
          <input
            value={numberText}
            onChange={(e) => setNumberText(e.target.value.replace(/\D/g, "").slice(0, 2))}
            inputMode="numeric"
            autoComplete="off"
            placeholder="내 번호"
            className={`${inputClass} placeholder:text-lg`}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-lg font-semibold text-gray-700">이름</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={10}
            autoComplete="off"
            placeholder="내 이름"
            className={`${inputClass} placeholder:text-lg`}
          />
        </label>

        {error && (
          <p role="alert" className="text-lg font-semibold text-orange-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="min-h-16 w-full rounded-2xl bg-gray-900 px-6 text-[22px] font-bold text-white disabled:bg-gray-300"
        >
          {busy ? "들어가는 중…" : "시작하기"}
        </button>
        <p className="text-sm leading-relaxed text-gray-400">
          🔒 이름은 이 패드에만 남고 서버로 보내지 않아요. 저장되는 것은 번호와 답뿐이에요.
        </p>
      </form>
    </div>
  );
}
