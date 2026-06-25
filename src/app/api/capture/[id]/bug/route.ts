import { NextResponse } from "next/server";
import { getInboxCapture } from "@/lib/capture/queries";
import { promoteCaptureToBug } from "@/lib/bug/promote";

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
    const result = await promoteCaptureToBug(id, capture.projectSlug);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bug promotion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
