import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TeacherHomeClient from "./TeacherHomeClient";

export const metadata: Metadata = {
  title: "문장 호응 체크 — 방 만들기",
};

export default function HoeungTeacherPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-md px-4 pb-12 pt-6 sm:px-6">
          <div className="mb-1 flex items-center gap-3">
            <span className="text-3xl">✏️</span>
            <h1 className="text-xl font-bold text-[#1E293B] sm:text-2xl">
              문장 호응 체크 — 방 만들기
            </h1>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-gray-500">
            방을 만들면 학생 입장용 코드·QR과 교사 대시보드가 열립니다. 대시보드 맨 위 학생이
            지금 가 봐야 할 학생입니다.
          </p>

          <TeacherHomeClient />

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link
              href="/services/hoeung"
              className="font-semibold text-gray-700 underline underline-offset-2"
            >
              ← 학생 입장 화면
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
