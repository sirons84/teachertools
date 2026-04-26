import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOpenAI } from "@/lib/openai";
import { getAgentById } from "@/lib/classmate-agents";
import { auth } from "@/auth";

export const maxDuration = 60;

const LOGIN_REQUIRED_AGENTS = new Set(["feedback"]);

interface ChatRequestBody {
  browserId: string;
  agentId: string;
  conversationId?: string;
  message: string;
}

function makeTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim().replace(/\s+/g, " ");
  return trimmed.length > 30 ? trimmed.slice(0, 30) + "…" : trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const { browserId, agentId, conversationId, message } =
      (await req.json()) as ChatRequestBody;

    if (!browserId || !agentId || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const agent = getAgentById(agentId);
    if (!agent) {
      return NextResponse.json(
        { success: false, error: "에이전트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const requiresLogin = LOGIN_REQUIRED_AGENTS.has(agentId);
    const session = requiresLogin ? await auth() : null;
    const userId = session?.user?.id ?? null;

    if (requiresLogin && !userId) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    let convId = conversationId;
    if (convId) {
      const existing = await prisma.classmateConversation.findUnique({
        where: { id: convId },
        select: { id: true, browserId: true, userId: true, agentId: true },
      });
      if (!existing) {
        return NextResponse.json(
          { success: false, error: "대화를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      const ownsByUser = userId && existing.userId === userId;
      const ownsByBrowser =
        !LOGIN_REQUIRED_AGENTS.has(existing.agentId) &&
        existing.browserId === browserId;
      if (!ownsByUser && !ownsByBrowser) {
        return NextResponse.json(
          { success: false, error: "대화를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
    } else {
      const created = await prisma.classmateConversation.create({
        data: {
          browserId,
          agentId,
          title: makeTitle(message),
          userId,
        },
        select: { id: true },
      });
      convId = created.id;
    }

    const history = await prisma.classmateMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    await prisma.classmateMessage.create({
      data: { conversationId: convId, role: "user", content: message },
    });
    await prisma.classmateConversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    const openai = getOpenAI();
    const stream = await openai.chat.completions.create({
      model: agent.model || "gpt-4o-mini",
      messages: [
        { role: "system", content: agent.systemPrompt },
        ...history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: message },
      ],
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();
    let fullContent = "";
    const conversationIdForHeader = convId;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? "";
            if (delta) {
              fullContent += delta;
              controller.enqueue(encoder.encode(delta));
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
        }

        await prisma.classmateMessage
          .create({
            data: {
              conversationId: conversationIdForHeader,
              role: "assistant",
              content: fullContent,
            },
          })
          .catch(console.error);

        await prisma.classmateConversation
          .update({
            where: { id: conversationIdForHeader },
            data: { updatedAt: new Date() },
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
        "X-Conversation-Id": convId,
      },
    });
  } catch (err) {
    console.error("Classmate chat error:", err);
    return NextResponse.json(
      { success: false, error: "채팅 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
