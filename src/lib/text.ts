export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);

  return new Set(tokens);
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function extractTitle(text: string): string {
  const normalized = normalizeText(text);
  const firstLine = normalized.split(/[.\n]/)[0]?.trim() ?? normalized;
  if (firstLine.length <= 80) return firstLine;
  return `${firstLine.slice(0, 77)}...`;
}

export function extractSummary(text: string): string {
  const normalized = normalizeText(text);
  if (normalized.length <= 240) return normalized;
  return `${normalized.slice(0, 237)}...`;
}

export function buildBranchName(itemType: string, title: string): string {
  const prefix =
    itemType === "bug" || itemType === "regression"
      ? "fix"
      : itemType === "chore"
        ? "chore"
        : "feature";
  return `${prefix}/${slugify(title)}`;
}

export function buildSuggestedCommand(
  itemType: string,
  title: string,
  projectSlug: string,
  itemId?: string,
): string {
  const slug = slugify(title);
  if (itemType === "bug" || itemType === "regression") {
    return `/bug_fix ${projectSlug} ${slug}`;
  }
  if (itemType === "chore") {
    return `/chore ${projectSlug} ${slug}`;
  }
  if (projectSlug === "studioops") {
    const idPart = itemId ? ` ${itemId}` : "";
    return `/forge_pick${idPart}`;
  }
  return `/feature_build ${projectSlug} ${slug}`;
}

export function combinedSimilarity(
  titleA: string,
  summaryA: string,
  titleB: string,
  summaryB: string,
): { score: number; reason: string } {
  const titleTokensA = tokenize(titleA);
  const titleTokensB = tokenize(titleB);
  const summaryTokensA = tokenize(summaryA);
  const summaryTokensB = tokenize(summaryB);
  const allTokensA = new Set([...titleTokensA, ...summaryTokensA]);
  const allTokensB = new Set([...titleTokensB, ...summaryTokensB]);

  const titleScore = jaccardSimilarity(titleTokensA, titleTokensB);
  const summaryScore = jaccardSimilarity(summaryTokensA, summaryTokensB);
  const keywordScore = jaccardSimilarity(allTokensA, allTokensB);

  const score = titleScore * 0.45 + summaryScore * 0.35 + keywordScore * 0.2;

  const reasons: string[] = [];
  if (titleScore >= 0.5) reasons.push("similar title");
  if (summaryScore >= 0.4) reasons.push("similar summary");
  if (keywordScore >= 0.35) reasons.push("keyword overlap");

  return {
    score,
    reason: reasons.length > 0 ? reasons.join(", ") : "low similarity",
  };
}
