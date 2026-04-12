import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getViewUrl } from "@/lib/utils";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import QRGenerator from "@/components/sotongmun/QRGenerator";

export const metadata: Metadata = {
  title: "QR 결과",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params;

  const doc = await prisma.document.findUnique({
    where: { id },
    select: { id: true, title: true, createdAt: true },
  });

  if (!doc) notFound();

  const viewUrl = getViewUrl(doc.id);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-2xl font-bold text-[#1E293B] mb-1">
            다국어 사이트가 생성되었습니다!
          </h1>
          <p className="text-sm text-gray-500">{doc.title}</p>
        </div>

        {/* QR + URL */}
        <QRGenerator url={viewUrl} />

        {/* How to use */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <h3 className="font-semibold text-blue-800 mb-3">💡 사용 방법</h3>
          <ol className="space-y-1.5 text-sm text-blue-700 list-decimal list-inside">
            <li>QR코드를 가정통신문에 인쇄하거나</li>
            <li>URL을 카카오톡 / 문자로 학부모에게 보내세요</li>
            <li>학부모가 접속하면 모국어로 읽고 AI에게 질문할 수 있습니다</li>
          </ol>
        </div>

        {/* Preview link */}
        <div className="mt-4 text-center">
          <Link
            href={`/services/sotongmun/view/${doc.id}`}
            target="_blank"
            className="text-sm text-blue-600 hover:underline"
          >
            학부모 열람 페이지 미리보기 →
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/services/sotongmun/upload"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl px-5 py-2.5 hover:bg-gray-50 transition-colors"
          >
            📄 새 가정통신문 만들기
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
