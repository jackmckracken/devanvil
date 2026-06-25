import { prisma } from "@/lib/db";
import { detectProtectedDomains } from "@/lib/protected-domains/detection";
import { listProtectedDomains } from "@/lib/protected-domains/queries";
import { searchArchitecturalMemory } from "@/lib/workflow/memory";
import type { SuggestedInitiative } from "@/lib/workflow/types";
import { gatherArchitectEvidence, type ArchitectEvidence } from "@/lib/architect/evidence";

export type ArchitectContext = {
  evidence: ArchitectEvidence;
  memory: Awaited<ReturnType<typeof searchArchitecturalMemory>>;
  protectedDomains: Awaited<ReturnType<typeof detectProtectedDomains>>;
  relatedInitiatives: SuggestedInitiative[];
  records: { title: string; kind: string; path?: string | null; domainName: string }[];
};

export async function gatherArchitectContext(
  text: string,
  projectSlug: string,
): Promise<ArchitectContext> {
  const [evidence, memory, protectedDomains, initiatives, domainList] = await Promise.all([
    gatherArchitectEvidence(projectSlug),
    searchArchitecturalMemory(text, projectSlug, 10),
    detectProtectedDomains({ text, projectSlug }),
    findRelatedInitiatives(text, projectSlug),
    listProtectedDomains(projectSlug),
  ]);

  const records: ArchitectContext["records"] = [];
  for (const detection of protectedDomains) {
    for (const artifact of detection.artifactsToLoad.slice(0, 3)) {
      records.push({
        title: artifact.title,
        kind: artifact.kind,
        path: artifact.path,
        domainName: detection.domain.name,
      });
    }
  }

  if (records.length === 0) {
    for (const domain of domainList.slice(0, 3)) {
      records.push({
        title: domain.name,
        kind: "domain",
        path: `/protected-domains/${domain.slug}`,
        domainName: domain.name,
      });
    }
  }

  return { evidence, memory, protectedDomains, relatedInitiatives: initiatives, records };
}

async function findRelatedInitiatives(
  query: string,
  projectSlug: string,
): Promise<SuggestedInitiative[]> {
  const initiatives = await prisma.initiative.findMany({
    where: {
      project: { slug: projectSlug },
      status: { notIn: ["archived", "completed"] },
    },
    include: {
      items: {
        include: {
          devItem: { select: { title: true, normalizedSummary: true } },
        },
      },
    },
    take: 20,
  });

  const queryLower = query.toLowerCase();
  const tokens = queryLower.split(/\s+/).filter((t) => t.length > 3);

  return initiatives
    .map((init) => {
      const corpus = [
        init.title,
        init.description ?? "",
        ...init.items.flatMap((i) => [i.devItem.title, i.devItem.normalizedSummary]),
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      for (const token of tokens) {
        if (corpus.includes(token)) score += 1;
      }

      return {
        id: init.id,
        title: init.title,
        rationale:
          score > 0
            ? `Overlaps with current architectural thinking (${score} signals).`
            : "Active initiative in this project.",
        isNew: false,
        score,
      };
    })
    .filter((i) => i.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ score: _, ...rest }) => rest);
}

export function inferProductDomains(text: string): string[] {
  const lower = text.toLowerCase();
  const domains: string[] = [];

  const signals: [string, RegExp][] = [
    ["Workspace", /\bworkspace\b/i],
    ["Momentum", /\bmomentum\b/i],
    ["Memory", /\b(memory|architectural memory)\b/i],
    ["Practice Coach", /\bpractice(\s+coach)?\b/i],
    ["Dashboard", /\bdashboard\b/i],
    ["Investments", /\binvestment(s)?\b/i],
    ["Workbench", /\bworkbench\b/i],
    ["Bloom Runtime", /\bbloom\b/i],
    ["Forge", /\bforge\b/i],
    ["Auth", /\bauth(entication)?\b/i],
    ["Capture", /\bcapture\b/i],
  ];

  for (const [name, pattern] of signals) {
    if (pattern.test(lower)) domains.push(name);
  }

  if (domains.length === 0) {
    if (/\bartist(s)?\b/i.test(lower)) domains.push("Workspace", "Dashboard");
    if (/\blearn|studio|pedalboard|ableton|komplete\b/i.test(lower)) {
      domains.push("Investments", "Momentum");
    }
  }

  return [...new Set(domains)];
}
