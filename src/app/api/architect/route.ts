import { NextRequest, NextResponse } from "next/server";
import { startArchitectSession } from "@/lib/architect/session";

export async function POST(request: NextRequest) {
  let body: { text?: string; projectSlug?: string; captureId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.captureId && !body.text?.trim()) {
    return NextResponse.json(
      { error: "text or captureId is required" },
      { status: 400 },
    );
  }

  try {
    const session = await startArchitectSession(
      body.text?.trim() ?? "",
      body.projectSlug ?? "studioops",
      body.captureId,
    );
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Architect failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
