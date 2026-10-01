"use client";

import { useEffect, useRef } from "react";

/** 학생 입장용 QR — 방 코드가 미리 채워진 입장 화면으로 간다 */
export default function JoinQr({ code, size = 200 }: { code: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCode = (await import("qrcode")).default;
      if (cancelled || !canvasRef.current) return;
      const url = `${window.location.origin}/services/hoeung?code=${encodeURIComponent(code)}`;
      await QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 1,
        color: { dark: "#111827", light: "#ffffff" },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [code, size]);

  return <canvas ref={canvasRef} width={size} height={size} aria-label="학생 입장용 QR 코드" />;
}
