import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/hoeung/code";
import TvClient from "./TvClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "문장 호응 체크 — TV 화면",
  robots: { index: false },
};

export default async function HoeungTvPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = normalizeRoomCode(rawCode);
  const room = isValidRoomCode(code)
    ? await prisma.hoeungRoom.findUnique({ where: { code }, select: { code: true } })
    : null;
  if (!room) notFound();

  return <TvClient code={room.code} />;
}
