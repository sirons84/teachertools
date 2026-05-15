import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminTokenAsync, ADMIN_COOKIE_NAME } from "@/lib/padlet/admin-auth-edge";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/padlet/admin");
  const isAdminPage =
    pathname.startsWith("/services/padlet/admin") &&
    pathname !== "/services/padlet/admin/login";

  if (!isApi && !isAdminPage) return NextResponse.next();

  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await verifyAdminTokenAsync(token)) return NextResponse.next();

  if (isApi) {
    return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/services/padlet/admin/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/services/padlet/admin/:path*", "/api/padlet/admin/:path*"],
};
