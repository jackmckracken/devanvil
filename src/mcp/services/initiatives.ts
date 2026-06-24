import { prisma } from "@/lib/db";
import { assertFound } from "@/mcp/errors";
import {
  countItemsByStatus,
  getPortfolioFocus,
  getReadyItems,
} from "@/lib/initiatives/ready-items";
import {
  computePriorityScore,
  extractBlockers,
  extractDependencies,
} from "@/lib/initiatives/scoring";
import { getScoredInitiatives } from "@/lib/initiatives/queries";
import type { z } from "zod";
import type {
  getInitiativeSchema,
  getReadyItemsSchema,
  linkItemToInitiativeSchema,
  portfolioFocusSchema,
  searchInitiativesSchema,
} from "@/mcp/schemas";

type SearchInitiativesInput = z.infer<typeof searchInitiativesSchema>;

export async function searchInitiatives(input: SearchInitiativesInput) {
  const initiatives = await prisma.initiative.findMany({
    where: {
      ...(input.projectSlug
        ? { project: { slug: input.projectSlug } }
        : {}),
      ...(input.status
        ? { status: input.status }
        : { status: { not: "archived" } }),
      ...(input.priority ? { priority: input.priority } : {}),
      ...(input.strategicValue
        ? { strategicValue: input.strategicValue }
        : {}),
    },
    include: {
      items: {
        include: {
          devItem: {
            select: {
              id: true,
              status: true,
              itemType: true,
              title: true,
              normalizedSummary: true,
              priority: true,
              curationState: true,
              canonicalItemId: true,
            },
          },
        },
      },
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }],
    take: input.limit,
  });

  return initiatives
    .map((initiative) => {
      const items = initiative.items.map((i) => i.devItem);
      const regressionCount = items.filter(
        (i) => i.itemType === "regression",
      ).length;
      const duplicateCount = items.filter(
        (i) => i.curationState === "duplicate" || i.canonicalItemId !== null,
      ).length;

      const score = computePriorityScore({
        strategicValue: initiative.strategicValue,
        status: initiative.status,
        priority: initiative.priority,
        itemCount: items.length,
        duplicateCount,
        regressionCount,
        scoreOverride: initiative.scoreOverride,
      });

      return {
        id: initiative.id,
        title: initiative.title,
        status: initiative.status,
        priority: initiative.priority,
        strategicValue: initiative.strategicValue,
        score,
        linkedItemCount: items.length,
        scoreOverride: initiative.scoreOverride,
      };
    })
    .sort((a, b) => b.score - a.score);
}

type GetInitiativeInput = z.infer<typeof getInitiativeSchema>;

export async function getInitiative(input: GetInitiativeInput) {
  const initiative = await prisma.initiative.findUnique({
    where: { id: input.initiativeId },
    include: {
      project: { select: { id: true, name: true, slug: true } },
      items: {
        include: {
          devItem: {
            select: {
              id: true,
              title: true,
              status: true,
              itemType: true,
              priority: true,
              normalizedSummary: true,
              suggestedBranchName: true,
              suggestedCommand: true,
              curationState: true,
              canonicalItemId: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  assertFound(initiative, `Initiative not found: ${input.initiativeId}`);

  const items = initiative.items.map((i) => i.devItem);
  const regressionCount = items.filter((i) => i.itemType === "regression").length;
  const duplicateCount = items.filter(
    (i) => i.curationState === "duplicate" || i.canonicalItemId !== null,
  ).length;

  const score = computePriorityScore({
    strategicValue: initiative.strategicValue,
    status: initiative.status,
    priority: initiative.priority,
    itemCount: items.length,
    duplicateCount,
    regressionCount,
    scoreOverride: initiative.scoreOverride,
  });

  const blockers = extractBlockers(
    items.map((i) => ({
      status: i.status as "captured",
      title: i.title,
      itemType: i.itemType as "feature",
    })),
  );
  const dependencies = extractDependencies(items);

  const scored = await getScoredInitiatives(prisma, initiative.project.slug);
  const scoredInitiative = scored.find((s) => s.id === initiative.id);

  return {
    initiative: {
      id: initiative.id,
      title: initiative.title,
      description: initiative.description,
      status: initiative.status,
      priority: initiative.priority,
      strategicValue: initiative.strategicValue,
      targetRelease: initiative.targetRelease,
      scoreOverride: initiative.scoreOverride,
      score,
      project: initiative.project,
    },
    linkedItems: items.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      itemType: item.itemType,
      priority: item.priority,
      summary: item.normalizedSummary,
      suggestedBranch: item.suggestedBranchName,
      suggestedCommand: item.suggestedCommand,
    })),
    itemCountsByStatus: countItemsByStatus(items),
    blockers: scoredInitiative?.blockers ?? blockers,
    dependencies: scoredInitiative?.dependencies ?? dependencies,
    regressionCount,
    duplicateCount,
    inBuildCount: items.filter((i) => i.status === "in_build").length,
    readyCount: items.filter(
      (i) =>
        i.status === "approved" ||
        i.priority === "high" ||
        i.priority === "urgent",
    ).length,
    shippedCount: items.filter((i) => i.status === "shipped").length,
  };
}

type GetReadyItemsInput = z.infer<typeof getReadyItemsSchema>;

export async function getReadyItemsMcp(input: GetReadyItemsInput) {
  const items = await getReadyItems(prisma, {
    projectSlug: input.projectSlug,
    activeOnly: input.activeOnly,
    limit: input.limit,
  });

  return {
    projectSlug: input.projectSlug,
    activeOnly: input.activeOnly ?? false,
    count: items.length,
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      itemType: item.itemType,
      status: item.status,
      priority: item.priority,
      summary: item.summary,
      score: item.score,
      initiative: item.initiative,
      strategicValue: item.initiative?.strategicValue ?? null,
      suggestedBranch: item.suggestedBranch,
      suggestedCommand: item.suggestedCommand,
      rankingReasons: item.rankingReasons,
      blocked: item.blocked,
      blockers: item.blockers,
      rankingExplanation: [
        item.title,
        item.initiative ? `Initiative: ${item.initiative.title}` : "No initiative",
        `Reason: ${item.rankingReasons.join(" · ")}`,
      ].join("\n"),
    })),
  };
}

type LinkItemToInitiativeInput = z.infer<typeof linkItemToInitiativeSchema>;

export async function linkItemToInitiative(
  input: LinkItemToInitiativeInput,
) {
  const [item, initiative] = await Promise.all([
    prisma.devItem.findUnique({
      where: { id: input.itemId },
      select: { id: true, title: true, projectId: true },
    }),
    prisma.initiative.findUnique({
      where: { id: input.initiativeId },
      select: { id: true, title: true, projectId: true },
    }),
  ]);

  assertFound(item, `Item not found: ${input.itemId}`);
  assertFound(initiative, `Initiative not found: ${input.initiativeId}`);

  if (item.projectId !== initiative.projectId) {
    throw new Error(
      "Item and initiative must belong to the same project",
    );
  }

  const link = await prisma.initiativeItem.upsert({
    where: {
      initiativeId_devItemId: {
        initiativeId: input.initiativeId,
        devItemId: input.itemId,
      },
    },
    create: {
      initiativeId: input.initiativeId,
      devItemId: input.itemId,
    },
    update: {},
  });

  await prisma.devActivity.create({
    data: {
      devItemId: input.itemId,
      action: "initiative_linked",
      note:
        input.note ??
        `Linked to initiative "${initiative.title}" (${initiative.id}) via MCP`,
    },
  });

  return {
    linkId: link.id,
    itemId: item.id,
    itemTitle: item.title,
    initiativeId: initiative.id,
    initiativeTitle: initiative.title,
    created: true,
  };
}

type PortfolioFocusInput = z.infer<typeof portfolioFocusSchema>;

export async function portfolioFocus(input: PortfolioFocusInput) {
  return getPortfolioFocus(prisma, input.projectSlug);
}