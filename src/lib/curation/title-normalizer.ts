import type { TitleNormalization } from "@/lib/curation/types";

const STATUS_PREFIX =
  /^\[(?:concept|proposed|approved|in progress|shipped|deferred|frozen|fixed|resolved|duplicate|unresolved|watchlist|current)\]\s*/i;

const PAREN_STATUS_PREFIX =
  /^\((?:concept|proposed|approved|in progress|shipped|deferred|frozen|fixed|resolved|duplicate|unresolved|watchlist|current)\)\s*/i;

const FILE_PATH_FRAGMENT = /\b(?:docs|src|prisma|scripts)\/[\w./-]+\b/gi;

const MAX_TITLE = 80;

function stripMarkdown(title: string): string {
  return title
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^#+\s*/, "")
    .replace(/^[-*+]\s+/, "")
    .trim();
}

function takePrimarySegment(title: string): string {
  const segments = title.split(/\s[-–—]\s/);
  const primary = segments[0]?.trim() ?? title;

  if (segments.length > 1) {
    const rest = segments.slice(1).join(" ");
    if (/^(?:richest|species contract|teachers need|investigate|see also)/i.test(rest)) {
      return primary;
    }
    if (primary.length >= 20) return primary;
  }

  return primary;
}

function shortenVerboseTitle(title: string): string {
  let result = title;

  result = result.replace(
    /^add\s+(.+?)\s+(?:flow|feature|support)\s+to\s+\w+/i,
    (_, core: string) => `${core.trim()} flow`,
  );

  result = result.replace(
    /^(.+?)\s+never\s+populates\s+(\w+\s+\w+)/i,
    (_, subject: string, fields: string) => `${subject.trim()} ${fields.trim()} not populated`,
  );

  result = result.replace(
    /^(.+?)\s+mismatch\s+—\s+.+/i,
    (_, subject: string) => `${subject.trim()} mismatch`,
  );

  result = result.replace(
    /^(.+?)\s+handoff\s+(?:flow|for)\s+.+/i,
    (_, subject: string) => `${subject.trim()} handoff flow`,
  );

  result = result.replace(/\s+\.{3}$/, "");
  result = result.replace(/\s+→\s+Workbench/i, " handoff");
  result = result.replace(/\bhandoff handoff\b/i, "handoff");

  return result.trim();
}

function titleCaseIfAllLower(title: string): string {
  if (title !== title.toLowerCase()) return title;
  if (title.length < 4) return title;
  return title.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeTitle(title: string): TitleNormalization {
  const original = title.trim();
  let working = stripMarkdown(original);
  const reasons: string[] = [];

  if (STATUS_PREFIX.test(working)) {
    working = working.replace(STATUS_PREFIX, "");
    reasons.push("removed status label");
  }
  if (PAREN_STATUS_PREFIX.test(working)) {
    working = working.replace(PAREN_STATUS_PREFIX, "");
    reasons.push("removed status label");
  }

  if (FILE_PATH_FRAGMENT.test(working)) {
    working = working.replace(FILE_PATH_FRAGMENT, "").replace(/\s+/g, " ").trim();
    reasons.push("removed file path fragment");
  }

  const beforeSegment = working;
  working = takePrimarySegment(working);
  if (working !== beforeSegment) {
    reasons.push("trimmed em dash description");
  }

  const beforeShorten = working;
  working = shortenVerboseTitle(working);
  if (working !== beforeShorten) {
    reasons.push("shortened verbose title");
  }

  working = working.replace(/\s+/g, " ").trim();

  if (working.length > MAX_TITLE) {
    working = `${working.slice(0, MAX_TITLE - 3).trim()}...`;
    reasons.push("truncated to max length");
  }

  if (working.length >= 3 && working === working.toLowerCase()) {
    working = titleCaseIfAllLower(working);
  }

  const changed = working !== original && working.length >= 8;

  return {
    original,
    normalized: changed ? working : original,
    changed,
    reason: reasons.length > 0 ? reasons.join(", ") : "no change needed",
  };
}

export function normalizeTitleForComparison(title: string): string {
  const { normalized } = normalizeTitle(title);
  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
