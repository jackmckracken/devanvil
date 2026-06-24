import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { promoteClusterToInitiative } from "@/lib/initiatives/seed-initiatives";
import type { InitiativeStatus, StrategicValue } from "@/generated/prisma/client";

export async function POST(request: NextRequest) {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { projectSlug, title, description, itemIds, strategicValue, status } = body as {
    projectSlug: string;
    title: string;
    description?: string;
    itemIds: string[];
    strategicValue?: StrategicValue;
    status?: InitiativeStatus;
  };

  if (!projectSlug || !title || !itemIds?.length) {
    return NextResponse.json(
      { error: "projectSlug, title, and itemIds are required" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const result = await promoteClusterToInitiative(prisma, {
    projectId: project.id,
    title,
    description,
    itemIds,
    strategicValue,
    status,
  });

  return NextResponse.json(result, { status: 201 });
}
