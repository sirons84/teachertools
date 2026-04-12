import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Header from "@/components/layout/Header";
import ViewClient from "./ViewClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: doc?.title ?? "가정통신문",
    description: "가정통신문 다국어 안내 페이지입니다.",
  };
}

export default async function ViewPage({ params }: Props) {
  const { id } = await params;

  const doc = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      originalHtml: true,
      createdAt: true,
    },
  });

  if (!doc) notFound();

  return (
    <>
      <Header />
      <ViewClient
        documentId={doc.id}
        title={doc.title}
        originalHtml={doc.originalHtml}
        createdAt={doc.createdAt.toISOString()}
      />
    </>
  );
}
