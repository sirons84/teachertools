import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { normalizeRoomCode } from "@/lib/hoeung/code";
import EntryClient from "./EntryClient";

export const metadata: Metadata = {
  title: "문장 호응 체크",
  description:
    "5학년 국어 「문장 성분의 호응 관계」 개별 학습 도구. 학생은 패드로 PART1~4를 풀고, 교사는 대시보드에서 지금 도움이 필요한 학생을 확인합니다.",
};

export default async function HoeungEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const { code } = await searchParams;
  const initialCode = normalizeRoomCode(typeof code === "string" ? code : "").slice(0, 4);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-md px-4 pb-12 pt-6 sm:px-6">
          <div className="mb-1 flex items-center gap-3">
            <span className="text-3xl">✏️</span>
            <h1 className="text-xl font-bold text-[#1E293B] sm:text-2xl">문장 호응 체크</h1>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-gray-500">
            방 코드와 번호, 이름을 쓰고 시작해요. 같은 번호로 다시 들어오면 이어서 풀 수 있어요.
          </p>

          <EntryClient initialCode={initialCode} />

          <p className="mt-6 text-center text-sm text-gray-500">
            선생님이신가요?{" "}
            <Link
              href="/services/hoeung/teacher"
              className="font-semibold text-gray-700 underline underline-offset-2"
            >
              방 만들기 →
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
