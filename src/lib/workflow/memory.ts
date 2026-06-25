import { prisma } from "@/lib/db";
import { combinedSimilarity } from "@/lib/text";
import type { ArchitecturalMemoryHit } from "@/lib/workflow/types";

function scoreTextMatch(query: string, target: string): number {
  const { score } = combinedSimilarity(query, query, target, target);
  return score;
}

export async function searchArchitecturalMemory(
  query: string,
  projectSlug?: string,
  limit = 8,
): Promise<ArchitecturalMemoryHit[]> {
  const hits: ArchitecturalMemoryHit[] = [];
  const q = query.trim();
  if (!q) return hits;

  const [intakes, initiatives, items, domains, investments] = await Promise.all([
    prisma.architecturalIntake.findMany({
      where: {
        ...(projectSlug ? { project: { slug: projectSlug } } : {}),
        OR: [
          { rawInput: { contains: q, mode: "insensitive" } },
          { intent: { contains: q, mode: "insensitive" } },
          { briefMarkdown: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { project: { select: { slug: true } } },
    }),
    prisma.initiative.findMany({
      where: {
        ...(projectSlug ? { project: { slug: projectSlug } } : {}),
        status: { not: "archived" },
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 20,
    }),
    prisma.devItem.findMany({
      where: {
        ...(projectSlug ? { project: { slug: projectSlug } } : {}),
        status: { notIn: ["archived", "rejected"] },
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { rawText: { contains: q, mode: "insensitive" } },
          { normalizedSummary: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 30,
    }),
    prisma.protectedDomain.findMany({
      where: {
        ...(projectSlug ? { project: { slug: projectSlug } } : {}),
        status: "active",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
      include: {
        artifacts: { take: 3 },
        changes: { orderBy: { updatedAt: "desc" }, take: 2 },
      },
    }),
    prisma.investment.findMany({
      where: {
        ...(projectSlug ? { project: { slug: projectSlug } } : {}),
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { capabilityTarget: { contains: q, mode: "insensitive" } },
          { capabilityAdded: { contains: q, mode: "insensitive" } },
          { reflection: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 15,
    }),
  ]);

  for (const intake of intakes) {
    const text = intake.intent ?? intake.rawInput;
    hits.push({
      source: "intake",
      id: intake.id,
      title: intake.intent ?? extractSnippet(intake.rawInput, 60),
      snippet: extractSnippet(intake.briefMarkdown ?? intake.rawInput, 120),
      relevance: scoreTextMatch(q, text),
      href: `/workspace/${intake.id}`,
    });
  }

  for (const initiative of initiatives) {
    hits.push({
      source: "initiative",
      id: initiative.id,
      title: initiative.title,
      snippet: initiative.description ?? "",
      relevance: scoreTextMatch(q, `${initiative.title} ${initiative.description ?? ""}`),
      href: `/initiatives/${initiative.id}`,
    });
  }

  for (const item of items) {
    hits.push({
      source: "work_item",
      id: item.id,
      title: item.title,
      snippet: item.normalizedSummary,
      relevance: scoreTextMatch(q, `${item.title} ${item.normalizedSummary}`),
      href: `/queue/${item.id}`,
    });
  }

  for (const domain of domains) {
    hits.push({
      source: "domain",
      id: domain.slug,
      title: domain.name,
      snippet: domain.description ?? `${domain.protectionLevel} protection`,
      relevance: scoreTextMatch(q, `${domain.name} ${domain.description ?? ""}`),
      href: `/protected-domains/${domain.slug}`,
    });

    for (const change of domain.changes) {
      hits.push({
        source: "domain_change",
        id: change.id,
        title: change.title,
        snippet: change.description ?? change.risk ?? "",
        relevance: scoreTextMatch(q, `${change.title} ${change.description ?? ""}`),
        href: `/protected-domains/${domain.slug}`,
      });
    }
  }

  for (const investment of investments) {
    const text = [
      investment.title,
      investment.description ?? "",
      investment.capabilityTarget ?? "",
      investment.capabilityAdded ?? "",
      investment.reflection ?? "",
    ].join(" ");
    hits.push({
      source: "investment",
      id: investment.id,
      title: investment.title,
      snippet:
        investment.capabilityAdded ??
        investment.capabilityTarget ??
        investment.description ??
        "",
      relevance: scoreTextMatch(q, text),
      href: `/investments/${investment.id}`,
    });
  }

  return hits
    .filter((h) => h.relevance > 0.1 || h.snippet.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

function extractSnippet(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 3)}...`;
}

export async function getRecentIntakes(projectSlug: string, limit = 6) {
  return prisma.architecturalIntake.findMany({
    where: { project: { slug: projectSlug } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      command: true,
      intent: true,
      rawInput: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function getRecentInvestigations(projectSlug: string, limit = 4) {
  return prisma.architecturalIntake.findMany({
    where: {
      project: { slug: projectSlug },
      command: "investigate",
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      command: true,
      intent: true,
      rawInput: true,
      status: true,
      createdAt: true,
    },
  });
}
