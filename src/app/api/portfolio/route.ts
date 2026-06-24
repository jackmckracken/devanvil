import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import {
  answerBlockingLaunch,
  answerWhatCanWait,
  answerWhatNext,
  getPortfolioHealth,
} from "@/lib/initiatives/queries";
import { seedStudioOpsInitiatives } from "@/lib/initiatives/seed-initiatives";

export async function GET(request: NextRequest) {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = request.nextUrl.searchParams.get("project") ?? undefined;
  const question = request.nextUrl.searchParams.get("q");

  switch (question) {
    case "what-next":
      return NextResponse.json(await answerWhatNext(prisma, project));
    case "blocking-launch":
      return NextResponse.json(await answerBlockingLaunch(prisma, project));
    case "what-can-wait":
      return NextResponse.json(await answerWhatCanWait(prisma, project));
    case "health":
      return NextResponse.json(await getPortfolioHealth(prisma, project));
    default:
      return NextResponse.json(
        { error: "Unknown question. Use q=what-next|blocking-launch|what-can-wait|health" },
        { status: 400 },
      );
  }
}

export async function POST(request: NextRequest) {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (body.action === "seed-studioops") {
    const result = await seedStudioOpsInitiatives(prisma);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
