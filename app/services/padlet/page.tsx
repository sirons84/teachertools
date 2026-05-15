import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "포스트잇 협업 보드",
  description: "주제별로 닉네임만 입력해 텍스트·이미지·파일·링크를 자유롭게 올리는 협업 보드입니다.",
};

export default function PadletIntroPage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">📌</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] mb-3">
            포스트잇 협업 보드
          </h1>
          <p className="text-gray-500 leading-relaxed">
            교사가 주제별 보드를 만들고, 학생/학부모는 닉네임만 입력해<br className="hidden sm:block" />
            자유 캔버스에 글·사진·파일·링크를 포스트잇처럼 올릴 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: "🎨", title: "자유 캔버스", desc: "포스트잇을 끌어 자유롭게 배치." },
            { icon: "🙂", title: "이모지·댓글", desc: "글에 반응하고 댓글로 대화." },
            { icon: "🔗", title: "QR/링크 공유", desc: "공개 링크 한 줄로 참여 시작." },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white border border-gray-100 rounded-xl p-5 text-center shadow-sm"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="font-semibold text-[#1E293B] mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8">
          <p className="text-sm text-blue-900">
            👩‍🏫 <strong>선생님이신가요?</strong> 관리자 페이지에서 새 보드를 만들고 공개 링크를 학생/학부모에게 공유하세요.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/services/padlet/admin"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-base transition-colors shadow-sm"
          >
            <span>관리자 페이지로 이동</span>
            <span>→</span>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
