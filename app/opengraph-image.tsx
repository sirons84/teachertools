import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "티처툴즈 — 선생님을 위한 스마트 도구 모음";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const robo = await readFile(join(process.cwd(), "public/robo.png"));
  const roboSrc = `data:image/png;base64,${robo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #fafaff 0%, #f3f1ff 50%, #fef1fc 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "80px",
            width: "100%",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={roboSrc}
            width={300}
            height={460}
            style={{ objectFit: "contain" }}
            alt=""
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 96,
                fontWeight: 800,
                lineHeight: 1.1,
                background:
                  "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              티처툴즈
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 600,
                color: "#475569",
                marginTop: 16,
              }}
            >
              TeacherTools
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 32,
                color: "#64748b",
                marginTop: 40,
                lineHeight: 1.4,
              }}
            >
              <div>선생님을 위한</div>
              <div>스마트 도구 모음</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
