import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET() {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(projects);
}
