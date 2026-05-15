import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/padlet/admin-auth";

export async function POST() {
  await clearAdminCookie();
  return NextResponse.json({ ok: true });
}
