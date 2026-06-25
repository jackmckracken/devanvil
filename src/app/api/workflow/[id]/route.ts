import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const intake = await prisma.architecturalIntake.findUnique({
    where: { id },
    include: { project: { select: { slug: true, name: true } } },
  });

  if (!intake) {
    return NextResponse.json({ error: "Intake not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: intake.id,
    command: intake.command,
    rawInput: intake.rawInput,
    intent: intake.intent,
    briefMarkdown: intake.briefMarkdown,
    result: intake.resultJson,
    status: intake.status,
    acceptedItemIds: intake.acceptedItemIds,
    projectSlug: intake.project.slug,
    projectName: intake.project.name,
    createdAt: intake.createdAt.toISOString(),
  });
}
