"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_RECORD_SEC,
  countByStudent,
  localDate,
  newId,
  parseStudentNo,
  type NugaRecord,
  type RosterEntry,
} from "@/lib/nuga";

type Status = "idle" | "recording" | "transcribing";

interface Draft {
  text: string;
  /** 인식 직후의 문장 — 교사가 손댔는지 판정용 */
  base: string;
  no: number | null;
  raw: string;
  note?: string;
}

interface Props {
  roster: RosterEntry[];
  records: NugaRecord[];
  onCreate: (record: NugaRecord) => void;
  onOpenStudent: (no: number) => void;
}

export default function RecordScreen({ roster, records, onCreate, onOpenStudent }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [micBlocked, setMicBlocked] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressAtRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const today = localDate();
  const maxNo = useMemo(
    () => (roster.length ? Math.max(...roster.map((r) => r.no)) : 24),
    [roster]
  );
  const todayCounts = useMemo(() => countByStudent(records, today), [records, today]);
  const totalCounts = useMemo(() => countByStudent(records), [records]);
  const recordedToday = roster.filter((r) => (todayCounts.get(r.no) ?? 0) > 0).length;

  const clearTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    tickRef.current = null;
    autoStopRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [clearTimers]);

  useEffect(() => {
    if (draft) textareaRef.current?.focus();
  }, [draft]);

  const openDraft = useCallback((d: Draft) => {
    setDraft(d);
    setHint(null);
  }, []);

  const sendAudio = useCallback(
    async (blob: Blob, ext: string) => {
      setStatus("transcribing");
      const fd = new FormData();
      fd.append("file", blob, `record.${ext}`);
      try {
        const res = await fetch("/api/nuga/transcribe", { method: "POST", body: fd });
        const data = await res.json().catch(() => null);

        if (data?.success && typeof data.text === "string" && data.text.trim()) {
          const parsed = parseStudentNo(data.text, maxNo);
          openDraft({
            text: parsed.text,
            base: parsed.text,
            no: parsed.no,
            raw: data.text,
            note:
              parsed.no == null
                ? "번호를 알아듣지 못했어요. 학생을 직접 선택해 주세요."
                : undefined,
          });
        } else {
          // 실패해도 기록을 놓치지 않도록 빈 카드를 연다
          openDraft({
            text: "",
            base: "",
            no: null,
            raw: "",
            note: data?.error ?? "인식하지 못했어요. 직접 입력해 주세요.",
          });
        }
      } catch {
        openDraft({
          text: "",
          base: "",
          no: null,
          raw: "",
          note: "네트워크 오류입니다. 직접 입력해 저장할 수 있어요.",
        });
      } finally {
        setStatus("idle");
      }
    },
    [maxNo, openDraft]
  );

  const stopRecording = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state === "recording") rec.stop();
  }, []);

  const startRecording = useCallback(async () => {
    if (status !== "idle") return;
    setHint(null);
    setDraft(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicBlocked(true);
      openDraft({
        text: "",
        base: "",
        no: null,
        raw: "",
        note: "이 브라우저는 녹음을 지원하지 않아요. 직접 입력해 주세요.",
      });
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicBlocked(true);
      openDraft({
        text: "",
        base: "",
        no: null,
        raw: "",
        note: "마이크 권한이 없어요. 주소창의 자물쇠에서 허용하거나, 여기에 직접 입력해 주세요.",
      });
      return;
    }

    streamRef.current = stream;
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      clearTimers();
      setElapsed(0);
      setStatus("idle");
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      recorderRef.current = null;

      const type = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];

      if (blob.size < 1200) {
        setHint("녹음이 너무 짧아요. 버튼을 누른 채로 말해 주세요.");
        return;
      }
      void sendAudio(blob, type.includes("mp4") ? "m4a" : "webm");
    };

    recorder.start();
    setStatus("recording");
    setElapsed(0);
    tickRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    autoStopRef.current = setTimeout(stopRecording, MAX_RECORD_SEC * 1000);
  }, [clearTimers, openDraft, sendAudio, status, stopRecording]);

  /* 길게 누르기(누르고 말한 뒤 떼기)와 탭(눌렀다 떼고 다시 탭) 모두 지원 */
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (status === "transcribing") return;
    if (status === "recording") {
      stopRecording();
      return;
    }
    pressAtRef.current = Date.now();
    void startRecording();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (status !== "recording") return;
    // 500ms 이상 누르고 있었다면 "떼면 종료", 짧게 눌렀다면 탭 모드로 계속 녹음
    if (Date.now() - pressAtRef.current >= 500) stopRecording();
  };

  const saveDraft = () => {
    if (!draft || draft.no == null) return;
    const text = draft.text.trim();
    if (!text) return;
    onCreate({
      id: newId(),
      no: draft.no,
      date: localDate(),
      createdAt: Date.now(),
      text,
      raw: draft.raw,
      edited: text !== draft.base.trim(),
    });
    setDraft(null);
    setHint(null);
  };

  const micLabel =
    status === "recording"
      ? `${elapsed}초 · 누르면 종료`
      : status === "transcribing"
        ? "인식 중…"
        : "눌러서 말하기";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-10">
      {/* ── 마이크 ─────────────────────────────── */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        disabled={status === "transcribing"}
        className={`w-full select-none touch-none rounded-3xl border-2 flex flex-col items-center justify-center gap-2 py-10 sm:py-14 transition-colors ${
          status === "recording"
            ? "bg-rose-600 border-rose-700 text-white animate-pulse"
            : status === "transcribing"
              ? "bg-gray-100 border-gray-200 text-gray-400"
              : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 active:bg-rose-200"
        }`}
      >
        <span className="text-6xl sm:text-7xl leading-none">
          {status === "recording" ? "⏺" : status === "transcribing" ? "⏳" : "🎙️"}
        </span>
        <span className="text-lg sm:text-xl font-extrabold">{micLabel}</span>
        <span
          className={`text-xs ${status === "recording" ? "text-rose-100" : "text-gray-500"}`}
        >
          {status === "recording"
            ? `최대 ${MAX_RECORD_SEC}초`
            : "예) “7번, 친구 의견을 먼저 정리해 줌”"}
        </span>
      </button>

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>
          오늘 {recordedToday}/{roster.length}명 기록 · 남은 {roster.length - recordedToday}명
        </span>
        <button
          type="button"
          onClick={() =>
            openDraft({ text: "", base: "", no: null, raw: "", note: "직접 입력 모드입니다." })
          }
          className="underline underline-offset-2 hover:text-gray-700"
        >
          ✍️ 직접 입력
        </button>
      </div>

      {hint && (
        <p className="mt-2 text-sm text-amber-700 bg-amber-50 rounded-xl px-3 py-2">{hint}</p>
      )}
      {micBlocked && !draft && (
        <p className="mt-2 text-xs text-gray-500">
          마이크를 쓸 수 없어도 「직접 입력」으로 기록할 수 있어요.
        </p>
      )}

      {/* ── 확인 카드 (생략 불가) ────────────────── */}
      {draft && (
        <div className="mt-4 rounded-2xl border-2 border-rose-200 bg-white p-4 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#1E293B]">저장 전 확인</h3>
            <span className="text-xs text-gray-400">{localDate()}</span>
          </div>
          {draft.note && <p className="mt-1 text-xs text-amber-700">{draft.note}</p>}

          <label className="block mt-3 text-xs font-semibold text-gray-500">학생</label>
          <select
            value={draft.no ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, no: e.target.value ? Number(e.target.value) : null })
            }
            className={`mt-1 w-full rounded-xl border p-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-rose-300 ${
              draft.no == null ? "border-amber-300 bg-amber-50 text-amber-800" : "border-gray-200"
            }`}
          >
            <option value="">— 학생을 선택하세요 —</option>
            {roster.map((r) => (
              <option key={r.no} value={r.no}>
                {r.no}번 {r.name}
              </option>
            ))}
          </select>

          <label className="block mt-3 text-xs font-semibold text-gray-500">기록 내용</label>
          <textarea
            ref={textareaRef}
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            rows={3}
            placeholder="관찰한 내용을 적어 주세요"
            className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-base leading-6 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
          {draft.raw && draft.raw !== draft.text && (
            <p className="mt-1 text-[11px] text-gray-400">인식 원문: {draft.raw}</p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={saveDraft}
              disabled={draft.no == null || !draft.text.trim()}
              className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:bg-gray-200 disabled:text-gray-400"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                void startRecording();
              }}
              className="px-4 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50"
            >
              다시 말하기
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="px-4 py-3 rounded-xl border border-gray-200 font-semibold text-gray-500 hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* ── 학생 그리드 ─────────────────────────── */}
      <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
        {roster.map((r) => {
          const todayN = todayCounts.get(r.no) ?? 0;
          const totalN = totalCounts.get(r.no) ?? 0;
          const active = todayN > 0;
          return (
            <button
              key={r.no}
              type="button"
              onClick={() => onOpenStudent(r.no)}
              className={`relative rounded-2xl border p-2 sm:p-3 text-left transition-colors ${
                active
                  ? "bg-white border-rose-200 hover:border-rose-400 shadow-sm"
                  : "bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100"
              }`}
            >
              <div className="text-[10px] sm:text-xs font-medium opacity-70">{r.no}번</div>
              <div
                className={`text-sm sm:text-base font-bold leading-tight ${active ? "text-[#1E293B]" : ""}`}
              >
                {r.name}
              </div>
              <div className="mt-1 flex items-center gap-1">
                {todayN > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-rose-600 text-white text-[11px] font-bold">
                    {todayN}
                  </span>
                ) : (
                  <span className="inline-block w-5 h-5 rounded-full border border-dashed border-gray-300" />
                )}
                {totalN > 0 && (
                  <span className="text-[10px] text-gray-400">누적 {totalN}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
