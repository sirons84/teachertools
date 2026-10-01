import { NextRequest, NextResponse } from "next/server";
import {
  buildDashboardStudents,
  buildSummary,
  type DashboardData,
} from "@/lib/hoeung/dashboard";
import { loadStudentRecords } from "@/lib/hoeung/records";
import { getTeacherRoom, rememberTeacherKey } from "@/lib/hoeung/teacher-auth";

type Ctx = { params: Promise<{ code: string }> };

/** 전체 학생 + 풀이 기록 + 뱃지 (교사 전용) */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { code } = await params;
  const auth = await getTeacherRoom(code, req.nextUrl.searchParams.get("k"));
  if (auth.status === "not-found") {
    return NextResponse.json({ error: "방을 찾을 수 없습니다." }, { status: 404 });
  }
  if (auth.status === "unauthorized") {
    return NextResponse.json({ error: "교사 확인이 필요합니다." }, { status: 401 });
  }
  // `?k=` 로 들어왔으면 쿠키에 넣어 이후 `?k` 없이 접근
  if (auth.viaQuery) await rememberTeacherKey(auth.room.code, auth.room.teacherKey);

  const records = await loadStudentRecords(auth.room.id);
  const data: DashboardData = {
    room: {
      code: auth.room.code,
      title: auth.room.title,
      createdAt: auth.room.createdAt.toISOString(),
    },
    teacherKey: auth.room.teacherKey,
    students: buildDashboardStudents(records, Date.now()),
    summary: buildSummary(records),
  };
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
