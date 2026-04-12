"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FileUploader from "@/components/sotongmun/FileUploader";
import LoadingSpinner from "@/components/common/LoadingSpinner";

type ExplanationTab = "file" | "text";

export default function UploadPage() {
  const router = useRouter();

  const [newsletterFile, setNewsletterFile] = useState<File | null>(null);
  const [explanationTab, setExplanationTab] = useState<ExplanationTab>("text");
  const [explanationFile, setExplanationFile] = useState<File | null>(null);
  const [explanationText, setExplanationText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterFile) {
      setError("가정통신문 파일을 업로드해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("newsletterFile", newsletterFile);
    if (explanationTab === "file" && explanationFile) {
      formData.append("explanationFile", explanationFile);
    }
    if (explanationTab === "text" && explanationText.trim()) {
      formData.append("explanationText", explanationText.trim());
    }

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      router.push(`/services/sotongmun/result/${data.documentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 font-medium">
              다국어 사이트를 생성하고 있습니다...
            </p>
            <p className="text-sm text-gray-400 mt-1">최대 1분 정도 소요될 수 있습니다.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1E293B] flex items-center gap-2 mb-2">
            <span>📄</span>
            <span>가정통신문 다국어 서비스</span>
          </h1>
          <p className="text-sm text-gray-500">
            가정통신문을 업로드하면 다국어 웹페이지가 만들어집니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1 */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-bold text-[#1E293B] mb-1 flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">1</span>
              가정통신문 업로드
            </h2>
            <p className="text-xs text-gray-400 mb-4">필수</p>

            <FileUploader
              onFile={setNewsletterFile}
              file={newsletterFile}
              accept=".hwpx,.pdf"
              label="파일을 여기에 끌어놓거나 클릭하여 선택하세요"
              hint="지원 형식: .hwpx, .pdf"
            />

            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                ⚠️ <strong>.hwp 파일</strong>은 한글에서 [파일 → 다른이름으로 저장] → <strong>hwpx 형식</strong>으로 변환 후 업로드해주세요.
              </p>
            </div>
          </section>

          {/* Step 2 */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-bold text-[#1E293B] mb-1 flex items-center gap-2">
              <span className="bg-gray-400 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">2</span>
              설명 문서 <span className="text-xs font-normal text-gray-400">(선택)</span>
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              AI가 학부모 질문에 답변할 때 참고할 자료입니다.
            </p>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              {(["file", "text"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setExplanationTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    explanationTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab === "file" ? "📎 파일 업로드" : "✏️ 직접 입력"}
                </button>
              ))}
            </div>

            {explanationTab === "file" ? (
              <FileUploader
                onFile={setExplanationFile}
                file={explanationFile}
                accept=".hwpx,.pdf,.txt"
                label="설명 문서 파일 업로드"
                hint="지원 형식: .hwpx, .pdf, .txt"
              />
            ) : (
              <textarea
                value={explanationText}
                onChange={(e) => setExplanationText(e.target.value)}
                placeholder="예: 현장학습 장소는 서울대공원입니다. 준비물은 도시락, 돗자리, 물통입니다. 우천시에는 실내 활동으로 대체됩니다..."
                rows={5}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none"
              />
            )}
          </section>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl transition-colors shadow-sm"
          >
            🌐 다국어 사이트 생성하기
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
