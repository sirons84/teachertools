import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlug, isValidSlug } from "@/lib/padlet/slug";

export async function GET() {
  const boards = await prisma.padletBoard.findMany({
    orderBy: [{ isArchived: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { posts: true } } },
  });
  return NextResponse.json({
    boards: boards.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      description: b.description,
      bgColor: b.bgColor,
      isArchived: b.isArchived,
      postCount: b._count.posts,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length < 1 || title.length > 80) {
    return NextResponse.json({ error: "제목은 1~80자여야 합니다." }, { status: 400 });
  }
  const description =
    typeof body.description === "string" ? body.description.trim().slice(0, 300) : null;
  const bgColor =
    typeof body.bgColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(body.bgColor)
      ? body.bgColor
      : "#FAFAFA";

  let slug =
    typeof body.slug === "string" && isValidSlug(body.slug) ? body.slug : generateSlug(title);

  // 중복 시 재시도
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.padletBoard.findUnique({ where: { slug } });
    if (!exists) break;
    slug = generateSlug(title);
  }

  const board = await prisma.padletBoard.create({
    data: { title, description, bgColor, slug },
  });
  return NextResponse.json({ board });
}
