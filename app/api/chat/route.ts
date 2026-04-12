import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOpenAI } from "@/lib/openai";
import { searchSimilarChunks } from "@/lib/embeddings";
import { translateToKorean, translateText } from "@/lib/translator";
import { SUPPORTED_LANGUAGES } from "@/constants/languages";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { documentId, message, langCode } = (await req.json()) as {
      documentId: string;
      message: string;
      langCode: string;
    };

    if (!documentId || !message || !langCode) {
      return NextResponse.json(
        { success: false, error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { originalContent: true, explanationContent: true },
    });
    if (!doc) {
      return NextResponse.json(
        { success: false, error: "문서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Translate user message to Korean for embedding search
    const koreanMessage =
      langCode === "ko" ? message : await translateToKorean(message, langCode);

    // RAG: find relevant chunks
    let relevantChunks: string[] = [];
    try {
      relevantChunks = await searchSimilarChunks(documentId, koreanMessage, 5);
    } catch {
      // Vector search may fail if no embeddings yet — graceful fallback
    }

    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    const langName = lang?.nativeName ?? langCode;

    const systemPrompt = `당신은 한국 학교의 가정통신문에 대해 학부모의 질문에 답변하는 AI 도우미입니다.

역할:
- 학부모가 가정통신문의 내용에 대해 질문하면 친절하고 정확하게 답변합니다.
- 반드시 제공된 [가정통신문 원문]과 [참고 자료]의 내용만을 기반으로 답변합니다.
- 제공된 자료에 없는 내용은 "해당 내용은 가정통신문에 포함되어 있지 않습니다. 담임 선생님께 문의해주세요."라고 답변합니다.
- 사용자의 언어(${langName})로 답변합니다. 반드시 ${langName}로만 답변하세요.

[가정통신문 원문]
${doc.originalContent.slice(0, 3000)}

[참고 자료]
${relevantChunks.join("\n\n") || (doc.explanationContent ?? "없음")}`;

    const openai = getOpenAI();

    // Streaming response
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.5,
      stream: true,
    });

    // Save user message
    await prisma.chatMessage.create({
      data: { documentId, role: "user", content: message, langCode },
    });

    const encoder = new TextEncoder();
    let fullAssistantContent = "";

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            fullAssistantContent += delta;
            controller.enqueue(encoder.encode(delta));
          }
        }

        // Save assistant message after stream completes
        await prisma.chatMessage
          .create({
            data: {
              documentId,
              role: "assistant",
              content: fullAssistantContent,
              langCode,
            },
          })
          .catch(console.error);

        controller.close();
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { success: false, error: "채팅 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
