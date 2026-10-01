/**
 * 문장 호응 체크 — 방의 학생·풀이 기록 읽기 (서버 전용).
 * 대시보드 / TV / CSV 가 같은 조회를 쓴다.
 */

import { prisma } from "@/lib/db";
import type { StudentRecord } from "./dashboard";

export async function loadStudentRecords(roomId: string): Promise<StudentRecord[]> {
  return prisma.hoeungStudent.findMany({
    where: { roomId },
    orderBy: { number: "asc" },
    select: {
      id: true,
      number: true,
      currentItemId: true,
      currentItemSince: true,
      lastActiveAt: true,
      attempts: {
        select: {
          itemId: true,
          part: true,
          answer: true,
          status: true,
          tries: true,
          checked: true,
          updatedAt: true,
        },
      },
    },
  });
}
