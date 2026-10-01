import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/hoeung/code";
import { buildTv } from "@/lib/hoeung/dashboard";
import { loadStudentRecords } from "@/lib/hoeung/records";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

/** TV 화면용 익명 집계 — 번호·답은 내보내지 않으므로 인증 없이 연다 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { code: rawCode } = await params;
  const code = normalizeRoomCode(rawCode);
  const room = isValidRoomCode(code)
    ? await prisma.hoeungRoom.findUnique({
        where: { code },
        select: { id: true, code: true, title: true },
      })
    : null;
  if (!room) {
    return NextResponse.json({ error: "방을 찾을 수 없습니다." }, { status: 404 });
  }

  const records = await loadStudentRecords(room.id);
  return NextResponse.json(buildTv(room, records, Date.now()), {
    headers: { "Cache-Control": "no-store" },
  });
}
