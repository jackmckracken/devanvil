import { NextRequest, NextResponse } from "next/server";
import { searchArchitecturalMemory } from "@/lib/workflow/memory";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const projectSlug = searchParams.get("project") ?? undefined;

  if (!query.trim()) {
    return NextResponse.json({ hits: [] });
  }

  const hits = await searchArchitecturalMemory(query, projectSlug, 12);
  return NextResponse.json({ hits });
}
