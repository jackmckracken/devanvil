import { NextResponse } from "next/server";
import { getAuditSession } from "@/lib/audit/session";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await getAuditSession(id);
  if (!session) {
    return NextResponse.json({ error: "Audit session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}
