"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "../AppContext";

export default function ChatInput({
  onAuthRequired,
}: {
  onAuthRequired?: () => void;
}) {
  const {
    currentAgent,
    isStreaming,
    pendingInput,
    setPendingInput,
    sendMessage,
  } = useApp();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [pendingInput]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const disabled = !currentAgent || isStreaming;
  const micBusy = isRecording || isTranscribing;

  const submit = () => {
    const value = pendingInput.trim();
    if (!value || disabled) return;
    if (onAuthRequired) {
      onAuthRequired();
      return;
    }
    setPendingInput("");
    sendMessage(value);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.state === "recording" && mediaRecorderRef.current.stop();
  };

  const startRecording = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      alert("이 브라우저는 음성 입력을 지원하지 않아요.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setIsRecording(false);

        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type });
        audioChunksRef.current = [];

        if (blob.size < 1000) {
          // too short / silent
          return;
        }

        const ext = type.includes("mp4") ? "m4a" : "webm";
        const fd = new FormData();
        fd.append("audio", blob, `recording.${ext}`);

        setIsTranscribing(true);
        try {
          const res = await fetch("/api/classmate/transcribe", {
            method: "POST",
            body: fd,
          });
          const data = await res.json();
          if (data.success && data.text) {
            const insertion = data.text.trim();
            setPendingInput(
              pendingInput.trim()
                ? `${pendingInput.trim()} ${insertion}`
                : insertion
            );
            requestAnimationFrame(() => textareaRef.current?.focus());
          } else {
            console.error("Transcribe failed:", data.error);
          }
        } catch (err) {
          console.error("Transcribe request failed:", err);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("getUserMedia error:", err);
      alert("마이크 권한이 필요해요. 브라우저 설정을 확인해줘.");
    }
  };

  const onMicClick = () => {
    if (disabled) return;
    if (isRecording) stopRecording();
    else startRecording();
  };

  return (
    <div className="shrink-0 px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <div
          className={`flex items-end gap-1 rounded-2xl bg-white border shadow-sm transition ${
            disabled
              ? "border-slate-200 opacity-80"
              : "border-slate-300 focus-within:border-indigo-400 focus-within:shadow-md"
          }`}
        >
          <textarea
            ref={textareaRef}
            value={pendingInput}
            onChange={(e) => setPendingInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            disabled={disabled}
            placeholder={
              isRecording
                ? "녹음 중... (마이크 버튼 다시 눌러 종료)"
                : isTranscribing
                ? "음성을 텍스트로 변환 중..."
                : currentAgent
                ? `${currentAgent.name}에게 메시지 보내기...`
                : "먼저 AI 친구를 선택해줘"
            }
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none px-4 py-3.5 text-sm placeholder:text-slate-400 min-h-[56px] max-h-[200px]"
          />

          <button
            onClick={onMicClick}
            disabled={disabled || isTranscribing}
            title={isRecording ? "녹음 종료" : "음성 입력"}
            aria-label={isRecording ? "녹음 종료" : "음성 입력"}
            className={`my-2 w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition relative ${
              disabled || isTranscribing
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : isRecording
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {isTranscribing ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4 animate-spin" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path
                  d="M21 12a9 9 0 0 0-9-9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M5 11a7 7 0 0 0 14 0M12 18v3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {isRecording && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
            )}
          </button>

          <button
            onClick={submit}
            disabled={disabled || !pendingInput.trim() || micBusy}
            className={`my-2 mr-2 w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition ${
              disabled || !pendingInput.trim() || micBusy
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white hover:shadow-md"
            }`}
            aria-label="전송"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path
                d="M5 12l14-7-4 14-3-5-7-2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="mt-1.5 text-[10px] text-slate-400 text-center">
          Enter로 전송 · Shift+Enter 줄바꿈 · 🎤 마이크로 음성 입력
        </div>
      </div>
    </div>
  );
}
