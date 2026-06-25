import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { listProtectedDomains } from "@/lib/protected-domains/queries";
import { seedProtectedDomains } from "@/lib/protected-domains/seed";

export async function GET(request: Request) {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectSlug = searchParams.get("project") ?? undefined;

  const domains = await listProtectedDomains(projectSlug);
  return NextResponse.json({ domains });
}

export async function POST(request: Request) {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let projectSlug = "studioops";
  try {
    const body = (await request.json()) as { action?: string; projectSlug?: string };
    if (body.action === "seed") {
      if (body.projectSlug?.trim()) {
        projectSlug = body.projectSlug.trim();
      }
      const count = await seedProtectedDomains(prisma, projectSlug);
      return NextResponse.json({ seeded: count, projectSlug });
    }
  } catch {
    // fall through
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
