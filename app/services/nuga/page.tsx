import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NugaClient from "./NugaClient";

export const metadata: Metadata = {
  title: "음성 누가기록",
  description:
    "수업 중 마이크에 대고 “7번, 친구 의견을 먼저 정리해 줌”이라고 말하면 해당 학생 칸에 오늘 날짜와 함께 기록이 쌓이는 교사 1인용 도구입니다.",
};

export default function NugaPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🎙️</span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B]">음성 누가기록</h1>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            말하면 쌓이는 누가기록. 번호를 말하면 학생이 자동 선택되고, 확인 후 저장하면 오늘
            기록이 +1 됩니다.
          </p>
          <p className="mt-2 text-xs text-gray-400 leading-relaxed">
            🔒 <span className="font-semibold">번호만 말하세요.</span> 서버로 나가는 것은 음성뿐이며
            학생 이름은 전송되지 않습니다. 명단·기록은 이 브라우저에만 저장되고 서버에는 아무것도
            남지 않습니다.
          </p>
        </div>
        <div className="mt-2">
          <NugaClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
