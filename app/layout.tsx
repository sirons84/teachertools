import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "티처툴즈 (TeacherTools)",
    template: "%s | 티처툴즈",
  },
  description:
    "선생님을 위한 스마트 도구 모음 — 가정통신문 다국어 서비스 등 다양한 교육 도구를 제공합니다.",
  keywords: ["교사", "선생님", "가정통신문", "다국어", "다문화", "TeacherTools", "티처툴즈"],
  openGraph: {
    title: "티처툴즈 (TeacherTools)",
    description: "선생님을 위한 스마트 도구 모음",
    locale: "ko_KR",
    type: "website",
    siteName: "티처툴즈",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "티처툴즈 — 선생님을 위한 스마트 도구 모음",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "티처툴즈 (TeacherTools)",
    description: "선생님을 위한 스마트 도구 모음",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#1E293B] antialiased">
        {children}
      </body>
    </html>
  );
}
