import { NextRequest, NextResponse } from "next/server";
import { checkPassword, setAdminCookie } from "@/lib/padlet/admin-auth";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const password = (body as { password?: unknown })?.password;
  if (typeof password !== "string") {
    return NextResponse.json({ error: "비밀번호가 필요합니다." }, { status: 400 });
  }
  if (!checkPassword(password)) {
    // 짧은 지연으로 무차별 대입 완화
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
