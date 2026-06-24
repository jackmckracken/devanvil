import { NextRequest, NextResponse } from "next/server";
import type { DevItemStatus, ItemType, Priority } from "@/generated/prisma/client";
import { getAuthenticatedSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const project = params.get("project") ?? undefined;
  const itemType = params.get("itemType") as ItemType | null;
  const status = params.get("status") as DevItemStatus | null;
  const priority = params.get("priority") as Priority | null;
  const search = params.get("search")?.trim();

  const items = await prisma.devItem.findMany({
    where: {
      ...(project ? { project: { slug: project } } : {}),
      ...(itemType ? { itemType } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { rawText: { contains: search, mode: "insensitive" } },
              { normalizedSummary: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      project: { select: { name: true, slug: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(items);
}
