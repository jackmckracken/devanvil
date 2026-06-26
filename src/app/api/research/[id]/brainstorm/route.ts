import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateBrainstorm } from "@/lib/research/brainstorm";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  const question = await prisma.researchQuestion.findUnique({
    where: { id },
  });

  if (!question) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = generateBrainstorm(question);

  await prisma.researchQuestion.update({
    where: { id },
    data: { brainstormJson: result },
  });

  return NextResponse.json(result);
}
