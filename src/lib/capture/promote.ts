import { prisma } from "@/lib/db";
import { getInboxCapture } from "@/lib/capture/queries";

export async function assertCapturePromotable(captureId: string) {
  const capture = await getInboxCapture(captureId);
  if (!capture) {
    throw new Error("Capture not found");
  }
  if (capture.promotedTo) {
    throw new Error(`Capture already promoted to ${capture.promotedTo}`);
  }
  return capture;
}

export async function markCapturePromoted(
  captureId: string,
  promotedTo: "architect" | "bug" | "audit" | "research",
  note: string,
) {
  await prisma.devItem.update({
    where: { id: captureId },
    data: {
      promotedTo,
      activity: {
        create: {
          action: `promoted:${promotedTo}`,
          note,
        },
      },
    },
  });
}
