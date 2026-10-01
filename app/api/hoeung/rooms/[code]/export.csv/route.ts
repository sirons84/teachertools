import { NextRequest, NextResponse } from "next/server";
import {
  ALL_ITEMS,
  STATUS_LABEL,
  answerText,
  getItem,
  itemLabel,
  type AttemptStatus,
} from "@/lib/hoeung/items";
import { loadStudentRecords } from "@/lib/hoeung/records";
import { getTeacherRoom } from "@/lib/hoeung/teacher-auth";

type Ctx = { params: Promise<{ code: string }> };

function csvCell(value: string | number): string {
  let s = String(value);
  // 엑셀이 학생 입력을 수식으로 읽지 않도록
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** 번호,PART,문항,답,상태,시도,확인 (교사 전용) */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { code } = await params;
  const auth = await getTeacherRoom(code, req.nextUrl.searchParams.get("k"));
  if (auth.status === "not-found") {
    return NextResponse.json({ error: "방을 찾을 수 없습니다." }, { status: 404 });
  }
  if (auth.status === "unauthorized") {
    return NextResponse.json({ error: "교사 확인이 필요합니다." }, { status: 401 });
  }

  const order = new Map(ALL_ITEMS.map((it, i) => [it.id, i]));
  const records = await loadStudentRecords(auth.room.id);

  const lines = [["번호", "PART", "문항", "답", "상태", "시도", "확인"].join(",")];
  for (const s of records) {
    const attempts = [...s.attempts].sort(
      (a, b) => (order.get(a.itemId) ?? 999) - (order.get(b.itemId) ?? 999)
    );
    for (const a of attempts) {
      const item = getItem(a.itemId);
      lines.push(
        [
          s.number,
          a.part,
          item ? itemLabel(a.itemId) : a.itemId,
          item ? answerText(item, a.answer) : a.answer,
          STATUS_LABEL[a.status as AttemptStatus] ?? a.status,
          a.tries,
          a.checked ? "O" : "",
        ]
          .map(csvCell)
          .join(",")
      );
    }
  }

  // BOM: 엑셀에서 한글이 깨지지 않도록
  return new NextResponse("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hoeung-${auth.room.code}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
