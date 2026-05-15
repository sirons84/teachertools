import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { prisma } from "@/lib/db";
import BoardClient from "@/components/padlet/BoardClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const board = await prisma.padletBoard.findUnique({ where: { slug }, select: { title: true } });
  return { title: board ? `[관리] ${board.title}` : "관리자 보드" };
}

export default async function PadletAdminBoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const board = await prisma.padletBoard.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, description: true, bgColor: true },
  });
  if (!board) notFound();

  return (
    <>
      <Header />
      <main className="flex-1">
        <BoardClient board={board} initialNickname={null} isAdmin={true} />
      </main>
      <Footer />
    </>
  );
}
