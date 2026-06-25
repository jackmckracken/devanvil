import { NextRequest, NextResponse } from "next/server";
import { discardArchitectSession } from "@/lib/architect/session";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    await discardArchitectSession(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
}
