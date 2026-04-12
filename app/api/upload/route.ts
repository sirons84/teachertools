import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { parseHwpx } from "@/lib/hwpx-parser";
import { parsePdf } from "@/lib/pdf-parser";
import { storeEmbeddings } from "@/lib/embeddings";
import { getViewUrl } from "@/lib/utils";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const newsletterFile = formData.get("newsletterFile") as File | null;
    const explanationFile = formData.get("explanationFile") as File | null;
    const explanationText = formData.get("explanationText") as string | null;

    if (!newsletterFile) {
      return NextResponse.json(
        { success: false, error: "가정통신문 파일이 필요합니다." },
        { status: 400 }
      );
    }

    const fileName = newsletterFile.name.toLowerCase();
    if (fileName.endsWith(".hwp") && !fileName.endsWith(".hwpx")) {
      return NextResponse.json(
        {
          success: false,
          error:
            ".hwp 파일은 지원하지 않습니다. 한글에서 [파일 > 다른이름으로 저장] → hwpx 형식으로 변환 후 다시 업로드해주세요.",
        },
        { status: 400 }
      );
    }

    if (!fileName.endsWith(".hwpx") && !fileName.endsWith(".pdf")) {
      return NextResponse.json(
        {
          success: false,
          error: ".hwpx 또는 .pdf 파일만 업로드 가능합니다.",
        },
        { status: 400 }
      );
    }

    // Upload file to Vercel Blob
    const fileBuffer = Buffer.from(await newsletterFile.arrayBuffer());
    const blob = await put(
      `sotongmun/${Date.now()}-${newsletterFile.name}`,
      fileBuffer,
      { access: "public" }
    );

    // Parse file
    let parsed: { title: string; text: string; html: string };
    if (fileName.endsWith(".hwpx")) {
      parsed = await parseHwpx(fileBuffer);
    } else {
      parsed = await parsePdf(fileBuffer);
    }

    // Handle explanation content
    let explanationContent: string | undefined;

    if (explanationFile) {
      const expFileName = explanationFile.name.toLowerCase();
      const expBuffer = Buffer.from(await explanationFile.arrayBuffer());
      let expParsed: { text: string };
      if (expFileName.endsWith(".hwpx")) {
        expParsed = await parseHwpx(expBuffer);
      } else if (expFileName.endsWith(".pdf")) {
        expParsed = await parsePdf(expBuffer);
      } else {
        expParsed = { text: await explanationFile.text() };
      }
      explanationContent = expParsed.text;
    } else if (explanationText?.trim()) {
      explanationContent = explanationText.trim();
    }

    // Save to DB
    const document = await prisma.document.create({
      data: {
        title: parsed.title,
        serviceType: "sotongmun",
        originalFileUrl: blob.url,
        originalFileName: newsletterFile.name,
        originalContent: parsed.text,
        originalHtml: parsed.html,
        explanationContent: explanationContent ?? null,
      },
    });

    // Store embeddings for explanation content (RAG)
    const embeddingSource =
      explanationContent
        ? `${parsed.text}\n\n${explanationContent}`
        : parsed.text;

    // Run embedding in background — don't await to avoid timeout
    storeEmbeddings(document.id, embeddingSource).catch(console.error);

    return NextResponse.json({
      success: true,
      documentId: document.id,
      viewUrl: getViewUrl(document.id),
    });
  } catch (err) {
    console.error("Upload error:", err);
    const message =
      err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
