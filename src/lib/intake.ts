import type { ArtifactType, SourceType } from "@/generated/prisma/client";
import { classifyIntake } from "@/lib/classifier";
import { toCaptureTitle } from "@/lib/capture/queries";
import type { CaptureResult } from "@/lib/capture/types";
import { prisma } from "@/lib/db";
import { findMatches, persistMatches } from "@/lib/duplicate-detection";
import type { ClassificationResult, IntakeRequest } from "@/lib/types";

function resolveSourceType(
  sourceType?: string,
  url?: string,
): SourceType {
  if (sourceType === "note" || sourceType === "screenshot") return "note";
  if (sourceType === "voice") return "voice";
  if (sourceType === "link" || sourceType === "url" || url) return "link";
  if (sourceType === "manual") return "manual";
  return "text";
}

function resolveArtifactType(sourceType: SourceType): ArtifactType {
  if (sourceType === "voice") return "transcript";
  if (sourceType === "link") return "link";
  if (sourceType === "note") return "note";
  return "note";
}

export async function processCapture(
  input: IntakeRequest & { projectSlug?: string },
): Promise<CaptureResult> {
  const text = input.text?.trim();
  if (!text) {
    throw new Error("text is required");
  }

  const projects = await prisma.project.findMany({
    where: { status: "active" },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  if (projects.length === 0) {
    throw new Error("No active projects configured");
  }

  const project =
    projects.find((p) => p.slug === input.projectSlug) ??
    projects.find((p) => p.slug === input.projectHint) ??
    projects[0]!;

  const sourceType = resolveSourceType(input.sourceType, input.url);
  const title = input.title?.trim() || toCaptureTitle(text);

  const metadata = {
    ...(input.metadata ?? {}),
    ...(input.platform ? { platform: input.platform } : {}),
    ...(input.sharedAt ? { sharedAt: input.sharedAt } : {}),
  };

  const item = await prisma.devItem.create({
    data: {
      projectId: project.id,
      title,
      rawText: text,
      normalizedSummary: text,
      sourceType,
      itemType: "question",
      status: "captured",
      isCapture: true,
      artifacts: {
        create: {
          artifactType: resolveArtifactType(sourceType),
          content: text,
          url: input.url,
          metadataJson:
            Object.keys(metadata).length > 0 ? metadata : undefined,
        },
      },
      activity: {
        create: {
          action: "captured",
          note: "Captured — no classification",
        },
      },
    },
    include: { project: true },
  });

  return {
    captureId: item.id,
    project: project.name,
    projectSlug: project.slug,
    status: "captured",
    rawText: text,
    sourceType,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function processIntake(
  input: IntakeRequest,
): Promise<ClassificationResult> {
  const text = input.text?.trim();
  if (!text) {
    throw new Error("text is required");
  }

  const projects = await prisma.project.findMany({
    where: { status: "active" },
    select: { id: true, name: true, slug: true, description: true },
    orderBy: { name: "asc" },
  });

  if (projects.length === 0) {
    throw new Error("No active projects configured");
  }

  const sourceType = resolveSourceType(input.sourceType, input.url);
  const classification = await classifyIntake({
    text,
    sourceType,
    projectHint: input.projectHint,
    projects,
  });

  const project = projects.find((p) => p.slug === classification.projectSlug);
  if (!project) {
    throw new Error(`Unknown project slug: ${classification.projectSlug}`);
  }

  const title = input.title?.trim() || classification.title;
  const summary = classification.summary;

  const { duplicates, related } = await findMatches(title, summary);
  const allMatches = [...duplicates, ...related];
  const topDuplicate = duplicates[0];

  const metadata = {
    ...(input.metadata ?? {}),
    ...(input.platform ? { platform: input.platform } : {}),
    ...(input.sharedAt ? { sharedAt: input.sharedAt } : {}),
  };

  const item = await prisma.devItem.create({
    data: {
      projectId: project.id,
      title,
      rawText: text,
      normalizedSummary: summary,
      sourceType,
      itemType: classification.itemType,
      status: topDuplicate ? "duplicate" : "captured",
      duplicateOfId: topDuplicate?.itemId,
      confidenceScore: classification.confidenceScore,
      suggestedBranchName: classification.suggestedBranchName,
      suggestedCommand: classification.suggestedCommand,
      artifacts: {
        create: {
          artifactType: resolveArtifactType(sourceType),
          content: text,
          url: input.url,
          metadataJson:
            Object.keys(metadata).length > 0 ? metadata : undefined,
        },
      },
      activity: {
        create: {
          action: "captured",
          note: topDuplicate
            ? `Auto-flagged as likely duplicate of "${topDuplicate.title}"`
            : "Item captured via intake API",
        },
      },
    },
    include: {
      project: true,
    },
  });

  await persistMatches(item.id, allMatches);

  return {
    itemId: item.id,
    project: project.name,
    projectSlug: project.slug,
    itemType: item.itemType,
    status: item.status,
    title: item.title,
    summary: item.normalizedSummary,
    matches: allMatches,
    suggestedBranchName: item.suggestedBranchName ?? classification.suggestedBranchName,
    suggestedCommand: item.suggestedCommand ?? classification.suggestedCommand,
    confidenceScore: item.confidenceScore ?? classification.confidenceScore,
  };
}
