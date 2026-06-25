import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getInboxCapture } from "@/lib/capture/queries";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const capture = await getInboxCapture(id);
  if (!capture) {
    return NextResponse.json({ error: "Capture not found" }, { status: 404 });
  }

  await prisma.devItem.update({
    where: { id },
    data: {
      status: "archived",
      activity: {
        create: {
          action: "discarded",
          note: "Capture discarded from inbox",
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
