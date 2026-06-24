import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth-server";
import { createIngestKey, listIngestKeys } from "@/lib/ingest-keys";

export async function GET() {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await listIngestKeys();
  return NextResponse.json({ keys });
}

export async function POST(request: Request) {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let label = "DevAnvil Ingest Key";
  try {
    const body = (await request.json()) as { label?: string };
    if (body.label?.trim()) {
      label = body.label.trim();
    }
  } catch {
    // optional body
  }

  const { key, rawKey } = await createIngestKey(label);
  return NextResponse.json({ key, rawKey }, { status: 201 });
}
