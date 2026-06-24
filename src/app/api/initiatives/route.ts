import { NextRequest, NextResponse } from "next/server";
import type {
  InitiativePriority,
  InitiativeStatus,
  StrategicValue,
} from "@/generated/prisma/client";
import { getAuthenticatedSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getScoredInitiatives } from "@/lib/initiatives/queries";

export async function GET(request: NextRequest) {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = request.nextUrl.searchParams.get("project") ?? undefined;
  const status = request.nextUrl.searchParams.get("status") as InitiativeStatus | null;

  const scored = await getScoredInitiatives(prisma, project);
  const filtered = status ? scored.filter((i) => i.status === status) : scored;

  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    projectSlug,
    title,
    description,
    status,
    priority,
    strategicValue,
    targetRelease,
    scoreOverride,
    itemIds,
  } = body as {
    projectSlug: string;
    title: string;
    description?: string;
    status?: InitiativeStatus;
    priority?: InitiativePriority;
    strategicValue?: StrategicValue;
    targetRelease?: string;
    scoreOverride?: number;
    itemIds?: string[];
  };

  if (!projectSlug || !title) {
    return NextResponse.json(
      { error: "projectSlug and title are required" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const initiative = await prisma.initiative.create({
    data: {
      projectId: project.id,
      title,
      description,
      status: status ?? "proposed",
      priority: priority ?? "medium",
      strategicValue: strategicValue ?? "infrastructure",
      targetRelease,
      scoreOverride: scoreOverride ?? null,
      ...(itemIds?.length
        ? {
            items: {
              create: itemIds.map((devItemId) => ({ devItemId })),
            },
          }
        : {}),
    },
    include: { items: true },
  });

  return NextResponse.json(initiative, { status: 201 });
}
