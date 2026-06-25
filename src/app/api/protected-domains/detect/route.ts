import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth-server";
import { analyzeForgeTask } from "@/lib/protected-domains/detection";

export async function POST(request: Request) {
  if (!(await getAuthenticatedSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    text: string;
    paths?: string[];
    projectSlug?: string;
  };

  if (!body.text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const analysis = await analyzeForgeTask({
    text: body.text,
    paths: body.paths,
    projectSlug: body.projectSlug,
  });

  return NextResponse.json(analysis);
}
