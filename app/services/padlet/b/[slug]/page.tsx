import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import { prisma } from "@/lib/db";
import { getNickname } from "@/lib/padlet/session";
import { normalizeSlug } from "@/lib/padlet/slug";
import BoardClient from "@/components/padlet/BoardClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const board = await prisma.padletBoard.findUnique({
    where: { slug: normalizeSlug(slug) },
    select: { title: true, description: true },
  });
  if (!board) return { title: "보드를 찾을 수 없습니다" };
  return {
    title: board.title,
    description: board.description ?? undefined,
  };
}

export default async function PublicBoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const board = await prisma.padletBoard.findUnique({
    where: { slug: normalizeSlug(slug) },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      bgColor: true,
      isArchived: true,
    },
  });
  if (!board) notFound();
  if (board.isArchived) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-5xl mb-3">📦</div>
            <h1 className="text-xl font-bold text-[#1E293B]">보관된 보드입니다</h1>
            <p className="text-sm text-gray-500 mt-2">관리자에게 문의해주세요.</p>
          </div>
        </main>
      </>
    );
  }

  const nickname = await getNickname();

  return (
    <>
      <Header />
      <main className="flex-1">
        <BoardClient board={board} initialNickname={nickname} isAdmin={false} />
      </main>
    </>
  );
}
