import type { CurationItem, DuplicateGroup } from "@/lib/curation/types";
import { normalizeTitleForComparison } from "@/lib/curation/title-normalizer";
import { combinedSimilarity } from "@/lib/text";

const DUPLICATE_THRESHOLD = 0.72;
const MERGE_CANDIDATE_THRESHOLD = 0.55;

type ScoredPair = {
  a: CurationItem;
  b: CurationItem;
  score: number;
  reason: string;
};

function pickCanonical(items: CurationItem[]): CurationItem {
  return [...items].sort((a, b) => {
    const normA = normalizeTitleForComparison(a.title);
    const normB = normalizeTitleForComparison(b.title);
    const normLenDiff = normA.length - normB.length;
    if (normLenDiff !== 0) return normLenDiff;

    const qualityDiff = (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
    if (Math.abs(qualityDiff) > 0.05) return qualityDiff;
    const titleDiff = a.title.length - b.title.length;
    if (titleDiff !== 0) return titleDiff;
    return a.id.localeCompare(b.id);
  })[0];
}

function unionFindGroups(
  items: CurationItem[],
  pairs: ScoredPair[],
): CurationItem[][] {
  const parent = new Map<string, string>();

  for (const item of items) {
    parent.set(item.id, item.id);
  }

  function find(id: string): string {
    let root = id;
    while (parent.get(root) !== root) {
      root = parent.get(root)!;
    }
    let current = id;
    while (parent.get(current) !== root) {
      const next = parent.get(current)!;
      parent.set(current, root);
      current = next;
    }
    return root;
  }

  function union(a: string, b: string): void {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootB, rootA);
  }

  for (const pair of pairs) {
    union(pair.a.id, pair.b.id);
  }

  const groups = new Map<string, CurationItem[]>();
  for (const item of items) {
    const root = find(item.id);
    const group = groups.get(root) ?? [];
    group.push(item);
    groups.set(root, group);
  }

  return [...groups.values()].filter((group) => group.length > 1);
}

export function findDuplicateGroups(items: CurationItem[]): DuplicateGroup[] {
  const activeItems = items.filter(
    (item) => item.status !== "archived" && item.status !== "rejected",
  );

  const pairs: ScoredPair[] = [];

  for (let i = 0; i < activeItems.length; i += 1) {
    for (let j = i + 1; j < activeItems.length; j += 1) {
      const a = activeItems[i];
      const b = activeItems[j];

      const normA = normalizeTitleForComparison(a.title);
      const normB = normalizeTitleForComparison(b.title);
      if (normA === normB) {
        pairs.push({ a, b, score: 0.95, reason: "identical normalized title" });
        continue;
      }

      const { score, reason } = combinedSimilarity(
        a.title,
        a.normalizedSummary,
        b.title,
        b.normalizedSummary,
      );

      if (score >= MERGE_CANDIDATE_THRESHOLD) {
        pairs.push({ a, b, score, reason });
      }
    }
  }

  const groups = unionFindGroups(activeItems, pairs);
  const duplicateGroups: DuplicateGroup[] = [];

  for (const group of groups) {
    const canonical = pickCanonical(group);
    const members = group
      .filter((item) => item.id !== canonical.id)
      .map((item) => {
        const pair = pairs.find(
          (p) =>
            (p.a.id === item.id && p.b.id === canonical.id) ||
            (p.b.id === item.id && p.a.id === canonical.id),
        );
        const score =
          pair?.score ??
          combinedSimilarity(
            item.title,
            item.normalizedSummary,
            canonical.title,
            canonical.normalizedSummary,
          ).score;

        return {
          id: item.id,
          title: item.title,
          similarity: Number(score.toFixed(3)),
          curationState:
            score >= DUPLICATE_THRESHOLD
              ? ("duplicate" as const)
              : ("merge_candidate" as const),
        };
      });

    duplicateGroups.push({
      canonicalId: canonical.id,
      canonicalTitle: canonical.title,
      members,
    });
  }

  return duplicateGroups.sort((a, b) => b.members.length - a.members.length);
}
