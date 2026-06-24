import type { PrismaClient } from "@/generated/prisma/client";
import { checkPortfolioConstraints } from "@/lib/initiatives/constraints";
import {
  computePriorityScore,
  extractBlockers,
  extractDependencies,
  whyInitiativeMatters,
} from "@/lib/initiatives/scoring";
import type {
  PortfolioAnswer,
  PortfolioHealth,
  ScoredInitiative,
} from "@/lib/initiatives/types";

const initiativeInclude = {
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
} as const;

type InitiativeWithItems = Awaited<
  ReturnType<PrismaClient["initiative"]["findMany"]>
>[number] & {
  items: {
    devItem: {
      id: string;
      title: string;
      status: string;
      itemType: string;
      priority: string;
      normalizedSummary: string;
      curationState: string;
      canonicalItemId: string | null;
    };
  }[];
};

function toScoredInitiative(initiative: InitiativeWithItems): ScoredInitiative {
  const items = initiative.items.map((i) => i.devItem);
  const regressionCount = items.filter((i) => i.itemType === "regression").length;
  const duplicateCount = items.filter(
    (i) => i.curationState === "duplicate" || i.canonicalItemId !== null,
  ).length;
  const inBuildCount = items.filter((i) => i.status === "in_build").length;

  const priorityScore = computePriorityScore({
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
    description: initiative.description,
    status: initiative.status,
    priority: initiative.priority,
    strategicValue: initiative.strategicValue,
    targetRelease: initiative.targetRelease,
    scoreOverride: initiative.scoreOverride,
    priorityScore,
    itemCount: items.length,
    regressionCount,
    duplicateCount,
    inBuildCount,
    blockers: extractBlockers(
      items.map((i) => ({
        status: i.status as "captured",
        title: i.title,
        itemType: i.itemType as "feature",
      })),
    ),
    dependencies: extractDependencies(items),
  };
}

export async function getScoredInitiatives(
  prisma: PrismaClient,
  projectSlug?: string,
): Promise<ScoredInitiative[]> {
  const initiatives = await prisma.initiative.findMany({
    where: {
      status: { not: "archived" },
      ...(projectSlug ? { project: { slug: projectSlug } } : {}),
    },
    include: initiativeInclude,
    orderBy: [{ status: "asc" }, { priority: "desc" }],
  });

  return initiatives
    .map((i) => toScoredInitiative(i as InitiativeWithItems))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export async function getPortfolioHealth(
  prisma: PrismaClient,
  projectSlug?: string,
): Promise<PortfolioHealth> {
  const [scored, backlogCount, regressionCount] = await Promise.all([
    getScoredInitiatives(prisma, projectSlug),
    prisma.devItem.count({
      where: {
        ...(projectSlug ? { project: { slug: projectSlug } } : {}),
        status: { notIn: ["archived", "rejected", "duplicate", "shipped"] },
        initiativeItems: { none: {} },
      },
    }),
    prisma.devItem.count({
      where: {
        ...(projectSlug ? { project: { slug: projectSlug } } : {}),
        itemType: "regression",
        status: { notIn: ["archived", "rejected", "shipped"] },
      },
    }),
  ]);

  const activeCount = scored.filter((i) => i.status === "active").length;
  const nextCount = scored.filter((i) => i.status === "next").length;
  const criticalCount = scored.filter(
    (i) => i.priority === "critical" && (i.status === "active" || i.status === "next"),
  ).length;
  const inBuildCount = scored.filter((i) => i.inBuildCount > 0).length;

  const warnings = checkPortfolioConstraints(
    scored.map((i) => ({
      status: i.status,
      priority: i.priority,
      inBuildCount: i.inBuildCount,
    })),
  );

  return {
    activeCount,
    nextCount,
    backlogSize: backlogCount,
    criticalCount,
    regressionCount,
    inBuildCount,
    warnings,
  };
}

export async function answerWhatNext(
  prisma: PrismaClient,
  projectSlug?: string,
): Promise<PortfolioAnswer> {
  const scored = await getScoredInitiatives(prisma, projectSlug);
  const candidates = scored.filter(
    (i) => i.status === "active" || i.status === "next",
  );
  const top = candidates.slice(0, 3);

  return {
    topInitiatives: top,
    whyTheyMatter: top.map((i) =>
      whyInitiativeMatters(i.strategicValue, i.priority, i.itemCount),
    ),
    blockers: top.flatMap((i) => i.blockers),
    dependencies: top.flatMap((i) => i.dependencies),
  };
}

export async function answerBlockingLaunch(
  prisma: PrismaClient,
  projectSlug?: string,
): Promise<{
  betaCritical: ScoredInitiative[];
  launchCritical: ScoredInitiative[];
  missingDependencies: string[];
}> {
  const scored = await getScoredInitiatives(prisma, projectSlug);

  const betaCritical = scored.filter(
    (i) =>
      i.strategicValue === "beta_critical" &&
      i.status !== "completed" &&
      i.status !== "archived",
  );
  const launchCritical = scored.filter(
    (i) =>
      i.strategicValue === "launch_critical" &&
      i.status !== "completed" &&
      i.status !== "archived",
  );

  return {
    betaCritical,
    launchCritical,
    missingDependencies: [...betaCritical, ...launchCritical].flatMap(
      (i) => i.dependencies,
    ),
  };
}

export async function answerWhatCanWait(
  prisma: PrismaClient,
  projectSlug?: string,
): Promise<ScoredInitiative[]> {
  const scored = await getScoredInitiatives(prisma, projectSlug);
  return scored.filter(
    (i) =>
      i.strategicValue === "future_vision" ||
      i.strategicValue === "research" ||
      i.strategicValue === "delight",
  );
}
