"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  url: string;
}

export default function QRGenerator({ url }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCode = (await import("qrcode")).default;
      if (!cancelled && canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, url, {
          width: 256,
          margin: 2,
          color: { dark: "#1E293B", light: "#ffffff" },
        });
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>QR코드 인쇄</title>
      <style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;}</style>
      </head><body>
      <img src="${dataUrl}" style="max-width:300px;" onload="window.print();window.close();" />
      </body></html>
    `);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* QR Card */}
      <div className="flex flex-col items-center gap-3 bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
        <canvas ref={canvasRef} className="rounded-lg" />
        <div className="flex gap-2 w-full">
          <button
            onClick={handleDownload}
            className="flex-1 text-sm py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            📥 다운로드
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 text-sm py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            🖨️ 인쇄
          </button>
        </div>
      </div>

      {/* URL Card */}
      <div className="flex flex-col gap-3 bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm flex-1">
        <h3 className="font-semibold text-gray-700">📋 공유 URL</h3>
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 break-all font-mono">
          {url}
        </div>
        <div className="flex flex-col gap-2 mt-auto">
          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {copied ? "✅ 복사됨!" : "📋 URL 복사"}
          </button>
        </div>
      </div>
    </div>
  );
}
