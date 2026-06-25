import { prisma } from "@/lib/db";
import { suggestTriageMode } from "@/lib/capture/triage";
import type { CaptureView } from "@/lib/capture/types";

function toCaptureTitle(rawText: string): string {
  const firstLine = rawText.split("\n")[0]?.trim() ?? rawText;
  if (firstLine.length <= 80) return firstLine;
  return `${firstLine.slice(0, 77)}...`;
}

function toCaptureView(item: {
  id: string;
  rawText: string;
  title: string;
  sourceType: CaptureView["sourceType"];
  status: string;
  promotedTo: CaptureView["promotedTo"];
  createdAt: Date;
  project: { slug: string };
}): CaptureView {
  return {
    id: item.id,
    projectSlug: item.project.slug,
    rawText: item.rawText,
    title: item.title,
    sourceType: item.sourceType,
    status: item.status,
    promotedTo: item.promotedTo,
    createdAt: item.createdAt.toISOString(),
    suggestedMode: item.promotedTo ? null : suggestTriageMode(item.rawText),
  };
}

export async function listInboxCaptures(projectSlug: string, limit = 50) {
  const items = await prisma.devItem.findMany({
    where: {
      project: { slug: projectSlug },
      isCapture: true,
      status: "captured",
      promotedTo: null,
    },
    include: { project: { select: { slug: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return items.map(toCaptureView);
}

export async function getInboxCapture(captureId: string) {
  const item = await prisma.devItem.findUnique({
    where: { id: captureId },
    include: { project: { select: { slug: true } } },
  });

  if (!item?.isCapture) return null;
  return toCaptureView(item);
}

export async function countInboxCaptures(projectSlug: string) {
  return prisma.devItem.count({
    where: {
      project: { slug: projectSlug },
      isCapture: true,
      status: "captured",
      promotedTo: null,
    },
  });
}

export { toCaptureTitle };
