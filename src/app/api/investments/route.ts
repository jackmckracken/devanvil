import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { classifyInvestment } from "@/lib/investments/classify";
import {
  createInvestmentFromClassification,
  listInvestments,
} from "@/lib/investments/queries";
import type { InvestmentCategory, InvestmentStatus } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectSlug = searchParams.get("project") ?? "studioops";
  const status = searchParams.get("status") as InvestmentStatus | null;
  const category = searchParams.get("category") as InvestmentCategory | null;

  const investments = await listInvestments(projectSlug, {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
  });

  return NextResponse.json({ investments });
}

export async function POST(request: NextRequest) {
  let body: { text?: string; projectSlug?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const projectSlug = body.projectSlug ?? "studioops";
  const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const classification = classifyInvestment(body.text);
  const investment = await createInvestmentFromClassification(
    project.id,
    classification,
    body.text,
  );

  return NextResponse.json({ investment }, { status: 201 });
}
