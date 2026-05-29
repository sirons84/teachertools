import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SeatArrangementClient from "./SeatArrangementClient";

export const metadata: Metadata = {
  title: "스마트 자리 배치",
  description:
    "성적·성별·특이사항을 고려해 4인 1조 모둠 자리를 자동 배치하고, 드래그 앤 드롭으로 손쉽게 수정·인쇄할 수 있습니다.",
};

export default function SeatArrangementPage() {
  return (
    <>
      <div className="print:hidden">
        <Header />
      </div>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 print:hidden">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🪑</span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B]">스마트 자리 배치</h1>
          </div>
          <p className="text-sm text-gray-500">
            성적·성별 균형 모둠 자동 구성 + 드래그 수동 조정 + 추가 요청사항(AI 해석) 반영 + 인쇄.
          </p>
        </div>
        <SeatArrangementClient />
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </>
  );
}
