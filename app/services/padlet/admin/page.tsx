import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { prisma } from "@/lib/db";
import AdminBoardsClient from "@/components/padlet/AdminBoardsClient";

export const metadata: Metadata = {
  title: "포스트잇 협업 보드 — 관리자",
};

export const dynamic = "force-dynamic";

export default async function PadletAdminPage() {
  const boards = await prisma.padletBoard.findMany({
    orderBy: [{ isArchived: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { posts: true } } },
  });

  const initial = boards.map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    description: b.description,
    bgColor: b.bgColor,
    isArchived: b.isArchived,
    postCount: b._count.posts,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));

  return (
    <>
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B] flex items-center gap-2">
              <span>📌</span>
              <span>포스트잇 협업 보드 — 관리자</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              주제별 보드를 생성하고, 글을 관리하세요.
            </p>
          </div>
        </div>
        <AdminBoardsClient initialBoards={initial} />
      </main>
      <Footer />
    </>
  );
}
