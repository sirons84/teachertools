import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import { getTeacherRoom } from "@/lib/hoeung/teacher-auth";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "문장 호응 체크 — 대시보드",
  robots: { index: false },
};

export default async function HoeungDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ k?: string | string[] }>;
}) {
  const { code } = await params;
  const { k } = await searchParams;
  const key = typeof k === "string" ? k : null;

  const auth = await getTeacherRoom(code, key);
  if (auth.status === "not-found") notFound();

  return (
    <>
      <Header />
      <main className="flex-1">
        {auth.status === "ok" ? (
          <DashboardClient code={auth.room.code} initialKey={auth.viaQuery ? key : null} />
        ) : (
          <div className="px-4 py-20 text-center">
            <div className="mb-3 text-5xl">🔑</div>
            <h1 className="text-xl font-bold text-[#1E293B]">교사용 주소로 들어와 주세요</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              방을 만든 기기에서 「교사용 주소 복사」로 받은 주소(…?k=…)로 열면 됩니다.
            </p>
            <Link
              href="/services/hoeung/teacher"
              className="mt-4 inline-block text-sm font-semibold underline"
            >
              방 만들기 화면으로
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
