import { NextRequest, NextResponse } from "next/server";
import { getEmbedPreview } from "@/lib/padlet/embed";

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  let body: { url?: unknown };
  try {
    body = (await req.json()) as { url?: unknown };
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });

  try {
    const preview = await getEmbedPreview(url);
    return NextResponse.json(preview);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "미리보기 실패";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
