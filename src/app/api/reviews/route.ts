import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { persistExecutiveReview } from "@/lib/reviews/executive";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const projectSlug = (body.projectSlug as string) ?? "studioops";
  const notes = body.notes as string | undefined;

  const review = await persistExecutiveReview(prisma, projectSlug, notes);

  return NextResponse.json({ id: review.id, createdAt: review.createdAt });
}
