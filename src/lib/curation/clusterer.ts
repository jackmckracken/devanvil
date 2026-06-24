import type { Cluster, CurationItem, DuplicateGroup } from "@/lib/curation/types";
import { normalizeTitleForComparison } from "@/lib/curation/title-normalizer";
import { jaccardSimilarity, tokenize } from "@/lib/text";

const CLUSTER_KEYWORD_THRESHOLD = 0.35;
const MIN_CLUSTER_SIZE = 2;

const CLUSTER_NAME_KEYWORDS: Record<string, string[]> = {
  "Practice Coach Handoffs": ["practice", "coach", "handoff", "workbench"],
  "Signal Rails Sprint 1": ["rail", "creator", "song", "bloom", "activation", "species"],
  "Signal Regression Watchlist": [
    "regression",
    "bloom",
    "emergence",
    "hover",
    "handoff",
    "enrichment",
    "collapse",
  ],
  "Product Memory / Dev Process": [
    "memory",
    "engineering",
    "product",
    "control",
    "center",
    "automation",
  ],
  "Pipeline & Media": ["pipeline", "media", "v3", "populate"],
  "Atom Taxonomy": ["atom", "taxonomy", "species"],
};

function extractKeywords(item: CurationItem): Set<string> {
  const text = `${item.title} ${item.normalizedSummary}`;
  return tokenize(text);
}

function inferClusterName(keywords: Set<string>): string {
  let bestName = "Related Items";
  let bestScore = 0;

  for (const [name, seeds] of Object.entries(CLUSTER_NAME_KEYWORDS)) {
    const seedSet = new Set(seeds);
    const score = jaccardSimilarity(keywords, seedSet);
    if (score > bestScore) {
      bestScore = score;
      bestName = name;
    }
  }

  if (bestScore < 0.15) {
    const top = [...keywords].slice(0, 3);
    if (top.length > 0) {
      return top.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" / ");
    }
  }

  return bestName;
}

export function buildClusters(
  items: CurationItem[],
  duplicateGroups: DuplicateGroup[],
): Cluster[] {
  const activeItems = items.filter(
    (item) =>
      item.status !== "archived" &&
      item.status !== "rejected" &&
      item.curationState !== "archive_junk",
  );

  const itemKeywords = new Map<string, Set<string>>();
  for (const item of activeItems) {
    itemKeywords.set(item.id, extractKeywords(item));
  }

  const parent = new Map<string, string>();
  for (const item of activeItems) {
    parent.set(item.id, item.id);
  }

  function find(id: string): string {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    return root;
  }

  function union(a: string, b: string): void {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootB, rootA);
  }

  for (const group of duplicateGroups) {
    for (const member of group.members) {
      union(group.canonicalId, member.id);
    }
  }

  for (let i = 0; i < activeItems.length; i += 1) {
    for (let j = i + 1; j < activeItems.length; j += 1) {
      const a = activeItems[i];
      const b = activeItems[j];

      if (a.itemType !== b.itemType) continue;

      const tokensA = itemKeywords.get(a.id)!;
      const tokensB = itemKeywords.get(b.id)!;
      const keywordScore = jaccardSimilarity(tokensA, tokensB);

      const normA = normalizeTitleForComparison(a.title);
      const normB = normalizeTitleForComparison(b.title);
      const titleOverlap =
        normA.includes(normB.slice(0, 12)) || normB.includes(normA.slice(0, 12));

      if (keywordScore >= CLUSTER_KEYWORD_THRESHOLD || titleOverlap) {
        union(a.id, b.id);
      }
    }
  }

  const groups = new Map<string, string[]>();
  for (const item of activeItems) {
    const root = find(item.id);
    const ids = groups.get(root) ?? [];
    ids.push(item.id);
    groups.set(root, ids);
  }

  const clusters: Cluster[] = [];
  let clusterIndex = 0;

  for (const itemIds of groups.values()) {
    if (itemIds.length < MIN_CLUSTER_SIZE) continue;

    const combinedKeywords = new Set<string>();
    for (const id of itemIds) {
      for (const token of itemKeywords.get(id) ?? []) {
        combinedKeywords.add(token);
      }
    }

    clusters.push({
      id: `cluster-${clusterIndex += 1}`,
      name: inferClusterName(combinedKeywords),
      itemIds,
      keywords: [...combinedKeywords].slice(0, 12),
    });
  }

  return clusters.sort((a, b) => b.itemIds.length - a.itemIds.length);
}
