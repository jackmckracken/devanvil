import { NextRequest, NextResponse } from "next/server";
import { listInboxCaptures } from "@/lib/capture/queries";
import { processCapture } from "@/lib/intake";
import type { IntakeRequest } from "@/lib/types";

export async function GET(request: NextRequest) {
  const projectSlug = request.nextUrl.searchParams.get("project") ?? "studioops";

  try {
    const captures = await listInboxCaptures(projectSlug);
    return NextResponse.json({ captures });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list captures";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: IntakeRequest & { projectSlug?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const result = await processCapture(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Capture failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
