"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * 학생 입장 주소 — 방 코드가 미리 채워진 입장 화면.
 * 서버 렌더 때는 빈 문자열 (주소는 브라우저에서만 알 수 있다).
 */
export function useJoinUrl(code: string): string {
  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => ""
  );
  return origin ? `${origin}/services/hoeung?code=${encodeURIComponent(code)}` : "";
}

/** 화면에 보여 줄 때는 https:// 를 뗀다 (받아 적기 쉽게) */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

/** 학생 입장용 QR — 방 코드가 미리 채워진 입장 화면으로 간다 */
export default function JoinQr({ code, size = 200 }: { code: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = useJoinUrl(code);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    (async () => {
      const QRCode = (await import("qrcode")).default;
      if (cancelled || !canvasRef.current) return;
      await QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 1,
        color: { dark: "#111827", light: "#ffffff" },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [url, size]);

  return <canvas ref={canvasRef} width={size} height={size} aria-label="학생 입장용 QR 코드" />;
}
