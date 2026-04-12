import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { translateDocument } from "@/lib/translator";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { documentId, targetLang } = (await req.json()) as {
      documentId: string;
      targetLang: string;
    };

    if (!documentId || !targetLang) {
      return NextResponse.json(
        { success: false, error: "documentId와 targetLang이 필요합니다." },
        { status: 400 }
      );
    }

    // Korean — return original
    if (targetLang === "ko") {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        select: { originalContent: true, originalHtml: true },
      });
      if (!doc) {
        return NextResponse.json(
          { success: false, error: "문서를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        translation: {
          id: "ko",
          documentId,
          langCode: "ko",
          content: doc.originalContent,
          html: doc.originalHtml,
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Check cache
    const cached = await prisma.translation.findUnique({
      where: { documentId_langCode: { documentId, langCode: targetLang } },
    });
    if (cached) {
      return NextResponse.json({ success: true, translation: cached });
    }

    // Fetch original HTML
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { originalHtml: true },
    });
    if (!doc) {
      return NextResponse.json(
        { success: false, error: "문서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Translate
    const { content, html } = await translateDocument(doc.originalHtml, targetLang);

    // Cache in DB
    const translation = await prisma.translation.create({
      data: { documentId, langCode: targetLang, content, html },
    });

    return NextResponse.json({ success: true, translation });
  } catch (err) {
    console.error("Translate error:", err);
    return NextResponse.json(
      { success: false, error: "번역 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
