import { prisma } from "@/lib/db";
import type { MatchResult } from "@/lib/types";
import { combinedSimilarity } from "@/lib/text";

const DUPLICATE_THRESHOLD = 0.72;
const RELATED_THRESHOLD = 0.45;

type ExistingItem = {
  id: string;
  title: string;
  normalizedSummary: string;
  project: { name: string };
};

export async function findMatches(
  title: string,
  summary: string,
  excludeId?: string,
): Promise<{
  duplicates: MatchResult[];
  related: MatchResult[];
}> {
  const existing = await prisma.devItem.findMany({
    where: {
      status: { notIn: ["archived", "rejected"] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: {
      id: true,
      title: true,
      normalizedSummary: true,
      project: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const scored = existing
    .map((item: ExistingItem) => {
      const { score, reason } = combinedSimilarity(
        title,
        summary,
        item.title,
        item.normalizedSummary,
      );

      return {
        itemId: item.id,
        title: item.title,
        project: item.project.name,
        similarityScore: Number(score.toFixed(3)),
        matchReason: reason,
      };
    })
    .filter((match) => match.similarityScore >= RELATED_THRESHOLD)
    .sort((a, b) => b.similarityScore - a.similarityScore);

  return {
    duplicates: scored.filter((m) => m.similarityScore >= DUPLICATE_THRESHOLD),
    related: scored.filter(
      (m) => m.similarityScore < DUPLICATE_THRESHOLD && m.similarityScore >= RELATED_THRESHOLD,
    ),
  };
}

export async function persistMatches(
  devItemId: string,
  matches: MatchResult[],
): Promise<void> {
  if (matches.length === 0) return;

  await prisma.devItemMatch.createMany({
    data: matches.map((match) => ({
      devItemId,
      matchedItemId: match.itemId,
      similarityScore: match.similarityScore,
      matchReason: match.matchReason,
    })),
  });
}
