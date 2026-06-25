import type {
  InvestmentCategory,
  InvestmentLeverage,
  InvestmentStatus,
  PrismaClient,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { InvestmentClassification } from "@/lib/investments/classify";

export type InvestmentSummary = {
  id: string;
  title: string;
  description: string | null;
  category: InvestmentCategory;
  status: InvestmentStatus;
  capabilityTarget: string | null;
  intentConnection: string | null;
  leverage: InvestmentLeverage;
  estimatedHours: number | null;
  compoundingValue: string | null;
  capabilityAdded: string | null;
  completedAt: string | null;
  createdAt: string;
};

export async function listInvestments(
  projectSlug: string,
  filters?: { status?: InvestmentStatus; category?: InvestmentCategory },
): Promise<InvestmentSummary[]> {
  const rows = await prisma.investment.findMany({
    where: {
      project: { slug: projectSlug },
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.category ? { category: filters.category } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return rows.map(toSummary);
}

export async function getInvestmentById(id: string) {
  const row = await prisma.investment.findUnique({
    where: { id },
    include: {
      project: { select: { slug: true, name: true } },
      initiativeLinks: {
        include: { initiative: { select: { id: true, title: true } } },
      },
      workItemLinks: {
        include: {
          devItem: { select: { id: true, title: true, status: true } },
        },
      },
    },
  });

  if (!row) return null;

  return {
    ...toSummary(row),
    projectSlug: row.project.slug,
    projectName: row.project.name,
    rawInput: row.rawInput,
    reflection: row.reflection,
    scheduledFor: row.scheduledFor?.toISOString() ?? null,
    initiatives: row.initiativeLinks.map((l) => ({
      id: l.initiative.id,
      title: l.initiative.title,
      recommended: l.recommended,
    })),
    enabledWorkItems: row.workItemLinks.map((l) => ({
      id: l.devItem.id,
      title: l.devItem.title,
      status: l.devItem.status,
      relationship: l.relationship,
    })),
  };
}

export async function createInvestmentFromClassification(
  projectId: string,
  classification: InvestmentClassification,
  rawInput: string,
  intakeId?: string,
) {
  return prisma.investment.create({
    data: {
      projectId,
      title: classification.title,
      description: classification.summary,
      rawInput,
      category: classification.category,
      status: "captured",
      capabilityTarget: classification.capabilityTarget,
      intentConnection: classification.intentConnection,
      leverage: classification.leverage,
      estimatedHours: classification.estimatedHours,
      compoundingValue: classification.compoundingValue,
      intakeId,
    },
  });
}

export async function updateInvestmentStatus(
  id: string,
  status: InvestmentStatus,
  reflection?: string,
) {
  const data: {
    status: InvestmentStatus;
    reflection?: string;
    capabilityAdded?: string;
    completedAt?: Date;
  } = { status };

  if (status === "completed") {
    data.completedAt = new Date();
    if (reflection) {
      data.reflection = reflection;
      data.capabilityAdded = reflection;
    }
  }

  return prisma.investment.update({ where: { id }, data });
}

export async function getSuggestedNextInvestment(projectSlug: string) {
  const active = await prisma.investment.findMany({
    where: {
      project: { slug: projectSlug },
      status: { in: ["captured", "scheduled"] },
    },
    orderBy: [{ leverage: "desc" }, { createdAt: "asc" }],
    take: 1,
  });

  return active[0] ? toSummary(active[0]) : null;
}

export async function getRecentlyCompleted(projectSlug: string, limit = 5) {
  const rows = await prisma.investment.findMany({
    where: {
      project: { slug: projectSlug },
      status: "completed",
    },
    orderBy: { completedAt: "desc" },
    take: limit,
  });

  return rows.map(toSummary);
}

export async function inferPotentialInvestments(
  client: PrismaClient,
  projectSlug: string,
): Promise<{ title: string; rationale: string; category: InvestmentCategory }[]> {
  const initiatives = await client.initiative.findMany({
    where: {
      project: { slug: projectSlug },
      status: { in: ["active", "next"] },
    },
    take: 5,
  });

  const suggestions: { title: string; rationale: string; category: InvestmentCategory }[] = [];

  for (const init of initiatives) {
    const lower = `${init.title} ${init.description ?? ""}`.toLowerCase();
    if (/\b(midi|ableton|push|production)\b/i.test(lower)) {
      suggestions.push({
        title: "Learn Ableton SDK",
        rationale: `Supports initiative: ${init.title}`,
        category: "experimentation",
      });
    }
    if (/\b(beta|launch|artist)\b/i.test(lower)) {
      suggestions.push({
        title: "Interview beta artists",
        rationale: `Customer insight for: ${init.title}`,
        category: "business",
      });
    }
  }

  const existing = await client.investment.findMany({
    where: { project: { slug: projectSlug } },
    select: { title: true },
  });
  const existingTitles = new Set(existing.map((e) => e.title.toLowerCase()));

  return suggestions
    .filter((s) => !existingTitles.has(s.title.toLowerCase()))
    .slice(0, 3);
}

function toSummary(row: {
  id: string;
  title: string;
  description: string | null;
  category: InvestmentCategory;
  status: InvestmentStatus;
  capabilityTarget: string | null;
  intentConnection: string | null;
  leverage: InvestmentLeverage;
  estimatedHours: number | null;
  compoundingValue: string | null;
  capabilityAdded: string | null;
  completedAt: Date | null;
  createdAt: Date;
}): InvestmentSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    capabilityTarget: row.capabilityTarget,
    intentConnection: row.intentConnection,
    leverage: row.leverage,
    estimatedHours: row.estimatedHours,
    compoundingValue: row.compoundingValue,
    capabilityAdded: row.capabilityAdded,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
