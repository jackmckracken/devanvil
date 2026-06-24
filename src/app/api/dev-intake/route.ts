import { NextRequest, NextResponse } from "next/server";
import { verifyIngestToken } from "@/lib/auth";
import { processIntake } from "@/lib/intake";
import type { IntakeRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!verifyIngestToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: IntakeRequest;
  try {
    body = (await request.json()) as IntakeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const result = await processIntake(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Intake failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
