import { NextRequest, NextResponse } from "next/server";
import type {
  InitiativePriority,
  InitiativeStatus,
  StrategicValue,
} from "@/generated/prisma/client";
import { getAuthenticatedSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getScoredInitiatives } from "@/lib/initiatives/queries";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const initiative = await prisma.initiative.findUnique({
    where: { id },
    include: {
      project: { select: { name: true, slug: true } },
      items: {
        include: {
          devItem: {
            include: { project: { select: { name: true, slug: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!initiative) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const scored = await getScoredInitiatives(prisma);
  const score = scored.find((s) => s.id === id);

  return NextResponse.json({ ...initiative, priorityScore: score?.priorityScore ?? 0 });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();

  const data: {
    title?: string;
    description?: string | null;
    status?: InitiativeStatus;
    priority?: InitiativePriority;
    strategicValue?: StrategicValue;
    targetRelease?: string | null;
    scoreOverride?: number | null;
  } = {};

  if ("title" in body) data.title = body.title;
  if ("description" in body) data.description = body.description;
  if ("status" in body) data.status = body.status;
  if ("priority" in body) data.priority = body.priority;
  if ("strategicValue" in body) data.strategicValue = body.strategicValue;
  if ("targetRelease" in body) data.targetRelease = body.targetRelease;
  if ("scoreOverride" in body) data.scoreOverride = body.scoreOverride;

  const initiative = await prisma.initiative.update({
    where: { id },
    data,
    include: { items: true },
  });

  return NextResponse.json(initiative);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await prisma.initiative.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
