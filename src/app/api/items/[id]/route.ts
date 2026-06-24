import { NextRequest, NextResponse } from "next/server";
import type { DevItemStatus } from "@/generated/prisma/client";
import { getAuthenticatedSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const item = await prisma.devItem.findUnique({
    where: { id },
    include: {
      project: true,
      duplicateOf: {
        select: { id: true, title: true, status: true },
      },
      matches: {
        include: {
          matchedItem: {
            select: {
              id: true,
              title: true,
              status: true,
              project: { select: { name: true } },
            },
          },
        },
        orderBy: { similarityScore: "desc" },
      },
      artifacts: {
        orderBy: { createdAt: "asc" },
      },
      activity: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

type PatchBody = {
  status?: DevItemStatus;
  priority?: "unset" | "low" | "medium" | "high" | "urgent";
  duplicateOfId?: string | null;
  note?: string;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as PatchBody;

  const existing = await prisma.devItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = await prisma.devItem.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.priority ? { priority: body.priority } : {}),
      ...(body.duplicateOfId !== undefined
        ? { duplicateOfId: body.duplicateOfId }
        : {}),
      activity: {
        create: {
          action: body.status ? `status:${body.status}` : "updated",
          note: body.note ?? undefined,
        },
      },
    },
    include: {
      project: true,
      matches: {
        include: {
          matchedItem: {
            select: {
              id: true,
              title: true,
              status: true,
              project: { select: { name: true } },
            },
          },
        },
      },
      activity: { orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json(item);
}
