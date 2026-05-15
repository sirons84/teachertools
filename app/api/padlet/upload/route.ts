import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

export const maxDuration = 60;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const FILE_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
]);

const IMG_MAX = 10 * 1024 * 1024;   // 10MB
const FILE_MAX = 25 * 1024 * 1024;  // 25MB

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const kind = (form.get("kind") as string | null) ?? "image";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
    }

    let allowed: Set<string>;
    let maxBytes: number;
    if (kind === "image") {
      allowed = IMAGE_TYPES;
      maxBytes = IMG_MAX;
    } else if (kind === "file") {
      allowed = FILE_TYPES;
      maxBytes = FILE_MAX;
    } else {
      return NextResponse.json({ error: "kind가 올바르지 않습니다." }, { status: 400 });
    }

    if (!allowed.has(file.type)) {
      return NextResponse.json(
        { error: `지원하지 않는 파일 형식입니다 (${file.type || "unknown"}).` },
        { status: 400 }
      );
    }
    if (file.size > maxBytes) {
      const limitMb = Math.round(maxBytes / 1024 / 1024);
      return NextResponse.json({ error: `최대 ${limitMb}MB까지 업로드할 수 있습니다.` }, { status: 400 });
    }

    const safeName = file.name.replace(/[^\w.\-가-힣]+/g, "_").slice(0, 80);
    const key = `padlet/${kind}/${Date.now()}-${nanoid(8)}-${safeName}`;
    const blob = await put(key, file, { access: "public", contentType: file.type });

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "업로드 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
