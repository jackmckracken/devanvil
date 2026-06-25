import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth-server";
import { getProtectedDomainBySlug } from "@/lib/protected-domains/queries";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const domain = await getProtectedDomainBySlug(slug);

  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  return NextResponse.json({ domain });
}
