import type { DevItemStatus, ItemType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { processIntake } from "@/lib/intake";
import { buildBranchName, buildSuggestedCommand } from "@/lib/text";
import type { SourceType } from "@/generated/prisma/client";
import { assertFound } from "@/mcp/errors";
import type { z } from "zod";
import type {
  createItemSchema,
  getItemSchema,
  searchItemsSchema,
  updateItemStatusSchema,
} from "@/mcp/schemas";

type SearchInput = z.infer<typeof searchItemsSchema>;

export async function searchItems(input: SearchInput) {
  const search = input.query?.trim();

  const items = await prisma.devItem.findMany({
    where: {
      ...(input.projectSlug ? { project: { slug: input.projectSlug } } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.itemType ? { itemType: input.itemType } : {}),
      ...(input.priority ? { priority: input.priority } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { rawText: { contains: search, mode: "insensitive" } },
              { normalizedSummary: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      project: { select: { name: true, slug: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: input.limit,
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    project: item.project.name,
    projectSlug: item.project.slug,
    itemType: item.itemType,
    status: item.status,
    priority: item.priority,
    summary: item.normalizedSummary,
    createdAt: item.createdAt.toISOString(),
    suggestedBranch: item.suggestedBranchName,
    suggestedCommand: item.suggestedCommand,
  }));
}

type GetItemInput = z.infer<typeof getItemSchema>;

export async function getItem(input: GetItemInput) {
  const item = await prisma.devItem.findUnique({
    where: { id: input.itemId },
    include: {
      project: true,
      duplicateOf: {
        select: { id: true, title: true, status: true },
      },
      matches: {
        include: {
          matchedItem: {
            select: {
              id: true,
              title: true,
              status: true,
              project: { select: { name: true, slug: true } },
            },
          },
        },
        orderBy: { similarityScore: "desc" },
      },
      artifacts: { orderBy: { createdAt: "asc" } },
      activity: { orderBy: { createdAt: "desc" } },
      builds: { orderBy: { createdAt: "desc" } },
    },
  });

  assertFound(item, `Item not found: ${input.itemId}`);

  return {
    item: {
      id: item.id,
      title: item.title,
      itemType: item.itemType,
      status: item.status,
      priority: item.priority,
      sourceType: item.sourceType,
      confidenceScore: item.confidenceScore,
      duplicateOfId: item.duplicateOfId,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    },
    project: {
      id: item.project.id,
      name: item.project.name,
      slug: item.project.slug,
    },
    rawText: item.rawText,
    normalizedSummary: item.normalizedSummary,
    duplicateOf: item.duplicateOf,
    matches: item.matches.map((match) => ({
      itemId: match.matchedItem.id,
      title: match.matchedItem.title,
      status: match.matchedItem.status,
      project: match.matchedItem.project.name,
      projectSlug: match.matchedItem.project.slug,
      similarityScore: match.similarityScore,
      matchReason: match.matchReason,
    })),
    artifacts: item.artifacts.map((artifact) => ({
      id: artifact.id,
      artifactType: artifact.artifactType,
      content: artifact.content,
      url: artifact.url,
      metadataJson: artifact.metadataJson,
      createdAt: artifact.createdAt.toISOString(),
    })),
    activity: item.activity.map((entry) => ({
      id: entry.id,
      action: entry.action,
      note: entry.note,
      createdAt: entry.createdAt.toISOString(),
    })),
    builds: item.builds.map((build) => ({
      id: build.id,
      repo: build.repo,
      branchName: build.branchName,
      commandUsed: build.commandUsed,
      planDocPath: build.planDocPath,
      contractReportPath: build.contractReportPath,
      status: build.status,
      createdAt: build.createdAt.toISOString(),
      updatedAt: build.updatedAt.toISOString(),
    })),
    suggestedBranch: item.suggestedBranchName,
    suggestedCommand: item.suggestedCommand,
  };
}

type UpdateItemStatusInput = z.infer<typeof updateItemStatusSchema>;

export async function updateItemStatus(input: UpdateItemStatusInput) {
  const existing = await prisma.devItem.findUnique({
    where: { id: input.itemId },
    select: { id: true, status: true },
  });

  assertFound(existing, `Item not found: ${input.itemId}`);

  const item = await prisma.devItem.update({
    where: { id: input.itemId },
    data: {
      status: input.status,
      activity: {
        create: {
          action: `status:${input.status}`,
          note:
            input.note ??
            `Status changed from ${existing.status} to ${input.status} via MCP`,
        },
      },
    },
    include: {
      project: { select: { name: true, slug: true } },
    },
  });

  return {
    id: item.id,
    title: item.title,
    status: item.status,
    project: item.project.name,
    projectSlug: item.project.slug,
    previousStatus: existing.status,
  };
}

type CreateItemInput = z.infer<typeof createItemSchema>;

export async function createItem(input: CreateItemInput) {
  const result = await processIntake({
    text: input.text,
    projectHint: input.projectHint,
    sourceType: input.sourceType as SourceType | undefined,
  });

  const overrides: {
    itemType?: ItemType;
    status?: DevItemStatus;
    suggestedBranchName?: string;
    suggestedCommand?: string;
  } = {};

  if (input.itemType && input.itemType !== result.itemType) {
    overrides.itemType = input.itemType;
    overrides.suggestedBranchName = buildBranchName(
      input.itemType,
      result.title,
    );
    overrides.suggestedCommand = buildSuggestedCommand(
      input.itemType,
      result.title,
      result.projectSlug,
    );
  }

  if (input.status && input.status !== result.status) {
    overrides.status = input.status;
  }

  if (Object.keys(overrides).length > 0) {
    await prisma.devItem.update({
      where: { id: result.itemId },
      data: {
        ...overrides,
        activity: {
          create: {
            action: "updated",
            note: "Fields adjusted after MCP intake (itemType/status override)",
          },
        },
      },
    });
  }

  await prisma.devActivity.create({
    data: {
      devItemId: result.itemId,
      action: "mcp_created",
      note: "Item created via DevAnvil MCP",
    },
  });

  const item = await getItem({ itemId: result.itemId });
  return {
    ...item,
    classification: {
      matches: result.matches,
      confidenceScore: result.confidenceScore,
    },
  };
}
