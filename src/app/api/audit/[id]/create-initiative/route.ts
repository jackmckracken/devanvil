import { NextResponse } from "next/server";
import { createPolishInitiativeFromAudit } from "@/lib/audit/session";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const result = await createPolishInitiativeFromAudit(id);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create polish initiative";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
