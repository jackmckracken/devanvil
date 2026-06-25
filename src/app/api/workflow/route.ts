import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processWorkflow } from "@/lib/workflow/process";
import type { WorkflowCommand } from "@/generated/prisma/client";

export async function POST(request: NextRequest) {
  let body: { text?: string; projectSlug?: string; command?: WorkflowCommand };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const projectSlug = body.projectSlug ?? "studioops";

  try {
    const result = await processWorkflow({
      text: body.text,
      projectSlug,
      command: body.command,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectSlug = searchParams.get("project") ?? "studioops";
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  const intakes = await prisma.architecturalIntake.findMany({
    where: { project: { slug: projectSlug } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      command: true,
      intent: true,
      rawInput: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ intakes });
}
