import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  clearSessionCookieOptions,
  createSessionToken,
  sessionCookieOptions,
  verifyUiPassword,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { password?: string };
  const password = body.password ?? "";

  if (!verifyUiPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieOptions(token));

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(clearSessionCookieOptions());
  return NextResponse.json({ ok: true });
}
