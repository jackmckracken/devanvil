import type {
  DevItemStatus,
  InitiativeStatus,
  ItemType,
  Priority,
  PrismaClient,
} from "@/generated/prisma/client";
import { buildSuggestedCommand, slugify } from "@/lib/text";
import {
  extractBlockers,
  extractDependencies,
  whyInitiativeMatters,
} from "@/lib/initiatives/scoring";
import { getPortfolioHealth, getScoredInitiatives } from "@/lib/initiatives/queries";
import type { ScoredInitiative } from "@/lib/initiatives/types";

const TERMINAL_STATUSES: DevItemStatus[] = [
  "in_build",
  "shipped",
  "duplicate",
  "rejected",
  "archived",
];

const INITIATIVE_STATUS_TIER: Record<InitiativeStatus, number> = {
  active: 100,
  next: 60,
  proposed: 30,
  paused: 10,
  completed: 0,
  archived: 0,
};

const IGNORED_INITIATIVE_STATUSES: InitiativeStatus[] = [
  "completed",
  "archived",
];

export type RankedReadyItem = {
  id: string;
  title: string;
  itemType: ItemType;
  status: DevItemStatus;
  priority: Priority;
  summary: string;
  suggestedBranch: string;
  suggestedCommand: string;
  score: number;
  initiative: {
    id: string;
    title: string;
    status: InitiativeStatus;
    strategicValue: string;
    priorityScore: number;
  } | null;
  rankingReasons: string[];
  blocked: boolean;
  blockers: string[];
};

export function isItemReady(
  status: DevItemStatus,
  priority: Priority,
): boolean {
  if (TERMINAL_STATUSES.includes(status)) {
    return false;
  }
  return (
    status === "approved" || priority === "high" || priority === "urgent"
  );
}

export function itemReadinessScore(
  status: DevItemStatus,
  priority: Priority,
): number {
  if (status === "approved") return 100;
  if (priority === "urgent") return 90;
  if (priority === "high") return 80;
  if (priority === "medium") return 50;
  return 20;
}

export function buildForgeBranch(itemId: string, title: string): string {
  return `forge/dev-${itemId}-${slugify(title)}`;
}

function resolveSuggestedBranch(
  stored: string | null | undefined,
  itemId: string,
  title: string,
): string {
  return stored ?? buildForgeBranch(itemId, title);
}

export function computeReadyItemScore(
  item: { status: DevItemStatus; priority: Priority },
  initiative: ScoredInitiative | null,
): number {
  const initiativeScore = initiative?.priorityScore ?? 15;
  const tier = initiative
    ? INITIATIVE_STATUS_TIER[initiative.status]
    : 15;
  const readiness = itemReadinessScore(item.status, item.priority);

  let raw = initiativeScore * 0.45 + tier * 0.25 + readiness * 0.3;

  if (initiative && initiative.blockers.length > 0) {
    raw -= 15;
  }

  return Math.min(100, Math.max(0, Math.round(raw)));
}

export function buildRankingReasons(
  item: {
    status: DevItemStatus;
    priority: Priority;
  },
  initiative: ScoredInitiative | null,
): string[] {
  const reasons: string[] = [];

  if (initiative) {
    reasons.push(`${initiative.title} initiative`);
    if (initiative.status === "active") {
      reasons.push("Active initiative");
    } else if (initiative.status === "next") {
      reasons.push("Next initiative");
    } else if (initiative.status === "proposed") {
      reasons.push("Proposed initiative");
    }
    reasons.push(
      whyInitiativeMatters(
        initiative.strategicValue,
        initiative.priority,
        initiative.itemCount,
      ),
    );
  } else {
    reasons.push("Unlinked backlog item");
  }

  if (item.status === "approved") {
    reasons.push("Approved");
  }
  if (item.priority === "high" || item.priority === "urgent") {
    reasons.push(`${item.priority} priority`);
  }

  if (initiative && initiative.blockers.length > 0) {
    reasons.push(`Blocked: ${initiative.blockers[0]}`);
  } else {
    reasons.push("Not blocked");
  }

  return reasons;
}

type ReadyItemRow = {
  id: string;
  title: string;
  itemType: ItemType;
  status: DevItemStatus;
  priority: Priority;
  normalizedSummary: string;
  suggestedBranchName: string | null;
  suggestedCommand: string | null;
  project: { slug: string };
  initiativeItems: {
    initiative: {
      id: string;
      title: string;
      status: InitiativeStatus;
      strategicValue: string;
      priority: string;
      scoreOverride: number | null;
      items: { devItem: { id: string; status: string; itemType: string; title: string; normalizedSummary: string; priority: string; curationState: string; canonicalItemId: string | null } }[];
    };
  }[];
};

function pickPrimaryInitiative(
  initiativeItems: ReadyItemRow["initiativeItems"],
  scoredById: Map<string, ScoredInitiative>,
): ScoredInitiative | null {
  if (initiativeItems.length === 0) return null;

  const scored = initiativeItems
    .map((link) => scoredById.get(link.initiative.id))
    .filter((i): i is ScoredInitiative => i !== undefined)
    .filter((i) => !IGNORED_INITIATIVE_STATUSES.includes(i.status));

  if (scored.length === 0) return null;

  scored.sort((a, b) => {
    const tierDiff =
      INITIATIVE_STATUS_TIER[b.status] - INITIATIVE_STATUS_TIER[a.status];
    if (tierDiff !== 0) return tierDiff;
    return b.priorityScore - a.priorityScore;
  });

  return scored[0] ?? null;
}

function rowToRankedReadyItem(
  row: ReadyItemRow,
  scoredById: Map<string, ScoredInitiative>,
  projectSlug: string,
): RankedReadyItem | null {
  if (!isItemReady(row.status, row.priority)) {
    return null;
  }

  const initiative = pickPrimaryInitiative(row.initiativeItems, scoredById);
  const blockers = initiative?.blockers ?? [];

  return {
    id: row.id,
    title: row.title,
    itemType: row.itemType,
    status: row.status,
    priority: row.priority,
    summary: row.normalizedSummary,
    suggestedBranch: resolveSuggestedBranch(
      row.suggestedBranchName,
      row.id,
      row.title,
    ),
    suggestedCommand:
      row.suggestedCommand ??
      buildSuggestedCommand(row.itemType, row.title, projectSlug, row.id),
    score: computeReadyItemScore(row, initiative),
    initiative: initiative
      ? {
          id: initiative.id,
          title: initiative.title,
          status: initiative.status,
          strategicValue: initiative.strategicValue,
          priorityScore: initiative.priorityScore,
        }
      : null,
    rankingReasons: buildRankingReasons(row, initiative),
    blocked: blockers.length > 0,
    blockers,
  };
}

export async function getReadyItems(
  prisma: PrismaClient,
  input: { projectSlug: string; activeOnly?: boolean; limit?: number },
): Promise<RankedReadyItem[]> {
  const limit = input.limit ?? 25;
  const scored = await getScoredInitiatives(prisma, input.projectSlug);
  const scoredById = new Map(scored.map((i) => [i.id, i]));

  const rows = await prisma.devItem.findMany({
    where: {
      project: { slug: input.projectSlug },
      status: { notIn: TERMINAL_STATUSES },
      OR: [
        { status: "approved" },
        { priority: { in: ["high", "urgent"] } },
      ],
      curationState: { notIn: ["duplicate", "archive_junk"] },
      canonicalItemId: null,
    },
    include: {
      project: { select: { slug: true } },
      initiativeItems: {
        include: {
          initiative: {
            include: {
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
                      curationState: true,
                      canonicalItemId: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  const ranked = rows
    .map((row) =>
      rowToRankedReadyItem(row as ReadyItemRow, scoredById, input.projectSlug),
    )
    .filter((item): item is RankedReadyItem => item !== null)
    .filter((item) => {
      if (!input.activeOnly) return true;
      return (
        item.initiative !== null &&
        (item.initiative.status === "active" ||
          item.initiative.status === "next")
      );
    })
    .sort((a, b) => {
      const tierA = a.initiative
        ? INITIATIVE_STATUS_TIER[a.initiative.status]
        : 0;
      const tierB = b.initiative
        ? INITIATIVE_STATUS_TIER[b.initiative.status]
        : 0;
      if (tierB !== tierA) return tierB - tierA;
      if (b.score !== a.score) return b.score - a.score;
      return a.title.localeCompare(b.title);
    });

  return ranked.slice(0, limit);
}

export type PortfolioFocus = {
  projectSlug: string;
  topInitiatives: ScoredInitiative[];
  readyItems: RankedReadyItem[];
  blockers: string[];
  portfolioWarnings: string[];
  recommendedNextItem: RankedReadyItem | null;
  recommendedAction: string;
};

export async function getPortfolioFocus(
  prisma: PrismaClient,
  projectSlug: string,
): Promise<PortfolioFocus> {
  const [scored, readyItems, health] = await Promise.all([
    getScoredInitiatives(prisma, projectSlug),
    getReadyItems(prisma, { projectSlug, limit: 10 }),
    getPortfolioHealth(prisma, projectSlug),
  ]);

  const topInitiatives = scored
    .filter(
      (i) => i.status === "active" || i.status === "next",
    )
    .slice(0, 3);

  const blockers = topInitiatives.flatMap((i) => i.blockers);
  const recommendedNextItem =
    readyItems.find((item) => !item.blocked) ?? readyItems[0] ?? null;

  let recommendedAction = "No ready items. Triage backlog or approve items in DevAnvil.";
  if (recommendedNextItem) {
    recommendedAction = `Run /forge_pick and select DEV-${recommendedNextItem.id}: ${recommendedNextItem.title}`;
  }

  return {
    projectSlug,
    topInitiatives,
    readyItems,
    blockers,
    portfolioWarnings: health.warnings,
    recommendedNextItem,
    recommendedAction,
  };
}

export function countItemsByStatus(
  items: { status: string }[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
  }
  return counts;
}
