import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "가정통신문 다국어 서비스",
  description: "가정통신문을 업로드하면 다국어 웹페이지와 QR코드가 자동 생성됩니다.",
};

export default function SotongmunPage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">📄</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] mb-3">
            가정통신문 다국어 서비스
          </h1>
          <p className="text-gray-500 leading-relaxed">
            가정통신문을 업로드하면 11개 언어로 번역된 웹페이지와<br className="hidden sm:block" />
            QR코드가 자동으로 생성됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: "📤", title: "업로드", desc: "HWPX 또는 PDF 파일을 업로드하세요." },
            { icon: "🌐", title: "자동 번역", desc: "AI가 11개 언어로 자동 번역합니다." },
            { icon: "📱", title: "QR 공유", desc: "QR코드로 학부모에게 바로 공유하세요." },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-gray-100 rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="font-semibold text-[#1E293B] mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/services/sotongmun/upload"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-sm"
          >
            <span>시작하기</span>
            <span>→</span>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
