import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/padlet/admin-auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LoginForm from "@/components/padlet/LoginForm";

export const metadata: Metadata = {
  title: "포스트잇 협업 보드 — 관리자 로그인",
};

export default async function PadletAdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  if (await isAdmin()) redirect("/services/padlet/admin");
  const { from } = await searchParams;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-md mx-auto w-full px-4 sm:px-6 py-16">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📌</div>
          <h1 className="text-2xl font-bold text-[#1E293B]">관리자 로그인</h1>
          <p className="text-sm text-gray-500 mt-1">보드 관리에는 비밀번호가 필요합니다.</p>
        </div>
        <LoginForm redirectTo={from ?? "/services/padlet/admin"} />
      </main>
      <Footer />
    </>
  );
}
