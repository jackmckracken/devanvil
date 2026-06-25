import { NextRequest, NextResponse } from "next/server";
import { getInvestmentById, updateInvestmentStatus } from "@/lib/investments/queries";
import type { InvestmentStatus } from "@/generated/prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const investment = await getInvestmentById(id);
  if (!investment) {
    return NextResponse.json({ error: "Investment not found" }, { status: 404 });
  }
  return NextResponse.json(investment);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  let body: { status?: InvestmentStatus; reflection?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  if (body.status === "completed" && !body.reflection?.trim()) {
    return NextResponse.json(
      { error: "reflection is required when completing an investment" },
      { status: 400 },
    );
  }

  try {
    const investment = await updateInvestmentStatus(id, body.status, body.reflection);
    return NextResponse.json(investment);
  } catch {
    return NextResponse.json({ error: "Investment not found" }, { status: 404 });
  }
}
