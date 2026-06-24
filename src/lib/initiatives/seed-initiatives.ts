import type { PrismaClient } from "@/generated/prisma/client";
import type { InitiativeStatus, StrategicValue } from "@/generated/prisma/client";

type InitiativeTemplate = {
  title: string;
  description: string;
  strategicValue: StrategicValue;
  status: InitiativeStatus;
  matchPatterns: string[];
};

const STUDIOOPS_INITIATIVES: InitiativeTemplate[] = [
  {
    title: "Sprint 1 Rails",
    description:
      "Core rail infrastructure: Song Rail V1, Creator Rail V1, Rail P0 fields, identity media pipeline, whyThisBloom, and panel parity.",
    strategicValue: "beta_critical",
    status: "active",
    matchPatterns: [
      "song rail",
      "creator rail",
      "rail p0",
      "rail",
      "identity media",
      "media pipeline",
      "whythisbloom",
      "why this bloom",
      "panel parity",
      "bloom",
    ],
  },
  {
    title: "Practice Coach Activation Loop",
    description:
      "Practice Coach handoff, Practice → Workbench flow, and ActivitySession migration.",
    strategicValue: "beta_critical",
    status: "active",
    matchPatterns: [
      "practice coach",
      "practice handoff",
      "practice workbench",
      "practice → workbench",
      "activitysession",
      "activity session",
    ],
  },
  {
    title: "Runway Handoff System",
    description:
      "Send To Runway, task generation, production board, and release workflow.",
    strategicValue: "launch_critical",
    status: "next",
    matchPatterns: [
      "runway",
      "send to runway",
      "task generation",
      "production board",
      "release workflow",
    ],
  },
  {
    title: "Signal Stabilization",
    description: "Regression watchlist, signal stability, and emergence fixes.",
    strategicValue: "infrastructure",
    status: "next",
    matchPatterns: [
      "signal",
      "regression",
      "emergence",
      "stabiliz",
      "hover",
      "enrichment",
      "collapse",
    ],
  },
  {
    title: "Product Memory System",
    description:
      "Engineering memory, product control center, and dev process automation.",
    strategicValue: "infrastructure",
    status: "proposed",
    matchPatterns: [
      "product memory",
      "engineering memory",
      "control center",
      "dev process",
      "automation",
    ],
  },
];

function matchesPattern(text: string, patterns: string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

export async function seedStudioOpsInitiatives(
  prisma: PrismaClient,
): Promise<{ created: number; linked: number }> {
  const project = await prisma.project.findUnique({
    where: { slug: "studioops" },
  });

  if (!project) {
    return { created: 0, linked: 0 };
  }

  const items = await prisma.devItem.findMany({
    where: { projectId: project.id },
    select: { id: true, title: true, normalizedSummary: true },
  });

  let created = 0;
  let linked = 0;

  for (const template of STUDIOOPS_INITIATIVES) {
    const existing = await prisma.initiative.findFirst({
      where: { projectId: project.id, title: template.title },
    });

    const matchingItems = items.filter((item) => {
      const text = `${item.title} ${item.normalizedSummary}`;
      return matchesPattern(text, template.matchPatterns);
    });

    if (matchingItems.length === 0 && !existing) {
      continue;
    }

    let initiative = existing;

    if (!initiative) {
      initiative = await prisma.initiative.create({
        data: {
          projectId: project.id,
          title: template.title,
          description: template.description,
          strategicValue: template.strategicValue,
          status: template.status,
          priority:
            template.strategicValue === "beta_critical" ||
            template.strategicValue === "launch_critical"
              ? "high"
              : "medium",
        },
      });
      created += 1;
    }

    for (const item of matchingItems) {
      const alreadyLinked = await prisma.initiativeItem.findUnique({
        where: {
          initiativeId_devItemId: {
            initiativeId: initiative.id,
            devItemId: item.id,
          },
        },
      });

      if (!alreadyLinked) {
        await prisma.initiativeItem.create({
          data: { initiativeId: initiative.id, devItemId: item.id },
        });
        linked += 1;
      }
    }
  }

  return { created, linked };
}

export async function promoteClusterToInitiative(
  prisma: PrismaClient,
  params: {
    projectId: string;
    title: string;
    description?: string;
    itemIds: string[];
    strategicValue?: StrategicValue;
    status?: InitiativeStatus;
  },
): Promise<{ id: string; linkedCount: number }> {
  const initiative = await prisma.initiative.create({
    data: {
      projectId: params.projectId,
      title: params.title,
      description: params.description,
      strategicValue: params.strategicValue ?? "infrastructure",
      status: params.status ?? "proposed",
    },
  });

  let linkedCount = 0;
  for (const devItemId of params.itemIds) {
    const item = await prisma.devItem.findFirst({
      where: { id: devItemId, projectId: params.projectId },
    });
    if (!item) continue;

    await prisma.initiativeItem.create({
      data: { initiativeId: initiative.id, devItemId },
    });
    linkedCount += 1;
  }

  return { id: initiative.id, linkedCount };
}
