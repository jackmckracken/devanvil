import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearSessionCookieOptions } from "@/lib/auth";

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(clearSessionCookieOptions());
  return NextResponse.json({ ok: true });
}
