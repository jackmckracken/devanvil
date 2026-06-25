import { NextResponse } from "next/server";
import { getInboxCapture } from "@/lib/capture/queries";
import { promoteCaptureToResearch } from "@/lib/capture/research";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const capture = await getInboxCapture(id);
  if (!capture) {
    return NextResponse.json({ error: "Capture not found" }, { status: 404 });
  }

  if (capture.promotedTo) {
    return NextResponse.json(
      { error: `Capture already promoted to ${capture.promotedTo}` },
      { status: 409 },
    );
  }

  try {
    const result = await promoteCaptureToResearch(id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research promotion failed";
    const status = message.includes("substantive") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
