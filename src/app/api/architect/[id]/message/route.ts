import { NextRequest, NextResponse } from "next/server";
import { continueArchitectSession } from "@/lib/architect/session";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  let body: { message?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  try {
    const session = await continueArchitectSession(id, body.message.trim());
    return NextResponse.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Continue failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
