import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!doc) {
      return NextResponse.json(
        { error: "문서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(doc);
  } catch (err) {
    console.error("Document fetch error:", err);
    return NextResponse.json(
      { error: "문서 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
