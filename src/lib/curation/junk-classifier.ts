import type { JunkVerdict } from "@/lib/curation/types";

const EXACT_JUNK_PHRASES = new Set([
  "architectural decisions",
  "lessons learned",
  "regression log",
  "date",
  "root cause",
  "resolution",
  "purpose",
  "current state",
  "known gaps",
  "open questions",
  "production",
  "staging",
  "development",
  "document",
  "overview",
  "summary",
  "introduction",
  "background",
  "context",
  "notes",
  "references",
  "see also",
  "table of contents",
  "status",
  "state",
  "phase",
  "priority",
  "owner",
  "description",
  "details",
  "impact",
  "severity",
  "environment",
  "version",
  "category",
  "type",
  "name",
  "title",
  "feature",
  "decision",
  "question",
  "regression",
  "bug",
  "item",
  "action items",
  "next steps",
  "follow up",
  "follow-up",
  "related",
  "links",
  "changelog",
  "history",
  "timeline",
  "metrics",
  "goals",
  "objectives",
  "scope",
  "out of scope",
  "requirements",
  "acceptance criteria",
  "test plan",
  "rollout",
  "deployment",
  "monitoring",
  "observability",
  "dependencies",
  "risks",
  "mitigations",
  "alternatives",
  "rationale",
  "consequences",
  "implementation",
  "design",
  "architecture",
  "technical debt",
  "parking lot",
  "future concepts",
  "active development",
  "approved next",
  "orphaned features",
  "known regressions",
  "regression watchlist",
  "planned features",
  "deferred features",
  "shipped",
]);

const GENERIC_SECTION_PATTERNS = [
  /^(?:section|part|chapter|appendix)\s+\d+$/i,
  /^#{1,6}\s/,
  /^[-*+]\s/,
  /^\d+\.\s/,
];

const DATE_ONLY =
  /^(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})$/i;

const FILE_PATH =
  /^(?:docs\/|src\/|\.github\/|prisma\/|scripts\/)[\w./-]+(?:\.md|\.ts|\.tsx|\.json|\.yml)?$/i;

const BRANCH_NAME = /^(?:feature|fix|chore|bugfix|hotfix|release)\/[\w-]+$/i;

const ENVIRONMENT_NAME = /^(?:production|staging|development|dev|prod|local|test|qa|uat)$/i;

const TABLE_SEPARATOR = /^[-:\s|]+$/;

const BACKTICK_PATH = /^`?(?:docs|src|prisma|scripts)\/[\w./-]+`?$/i;

const BOLD_LABEL = /^\*\*[\w\s-]+\*\*$/;

const STATUS_LABEL_ONLY =
  /^\[(?:concept|proposed|approved|in progress|shipped|deferred|frozen|fixed|resolved|duplicate|unresolved|watchlist|current)\]$/i;

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^#+\s*/, "")
    .replace(/[^\w\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isMostlyFieldLabel(title: string): boolean {
  const words = title.trim().split(/\s+/);
  if (words.length > 4) return false;
  const normalized = normalizeForMatch(title);
  return EXACT_JUNK_PHRASES.has(normalized);
}

function lacksActionableContent(title: string): boolean {
  const normalized = normalizeForMatch(title);
  if (normalized.length < 8) return true;
  if (wordsAreAllGeneric(normalized)) return true;
  return false;
}

const GENERIC_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "into",
  "about",
  "when",
  "where",
  "what",
  "how",
  "why",
]);

function wordsAreAllGeneric(text: string): boolean {
  const tokens = text.split(/\s+/).filter((t) => t.length > 2);
  if (tokens.length === 0) return true;
  const meaningful = tokens.filter((t) => !GENERIC_WORDS.has(t) && !EXACT_JUNK_PHRASES.has(t));
  return meaningful.length === 0;
}

export function classifyJunk(title: string, rawText?: string): JunkVerdict {
  const trimmed = title.trim();
  const normalized = normalizeForMatch(trimmed);

  if (!trimmed) {
    return { isJunk: true, reason: "empty title", confidence: 1 };
  }

  if (TABLE_SEPARATOR.test(trimmed)) {
    return { isJunk: true, reason: "table separator", confidence: 1 };
  }

  if (DATE_ONLY.test(trimmed)) {
    return { isJunk: true, reason: "date only", confidence: 0.95 };
  }

  if (FILE_PATH.test(trimmed)) {
    return { isJunk: true, reason: "file path only", confidence: 0.95 };
  }

  if (BRANCH_NAME.test(trimmed)) {
    return { isJunk: true, reason: "branch name only", confidence: 0.95 };
  }

  if (ENVIRONMENT_NAME.test(normalized)) {
    return { isJunk: true, reason: "environment name only", confidence: 0.95 };
  }

  if (STATUS_LABEL_ONLY.test(trimmed)) {
    return { isJunk: true, reason: "status label only", confidence: 0.95 };
  }

  if (BOLD_LABEL.test(trimmed)) {
    return { isJunk: true, reason: "markdown bold label", confidence: 0.95 };
  }

  if (BACKTICK_PATH.test(trimmed)) {
    return { isJunk: true, reason: "source file path", confidence: 0.95 };
  }

  for (const pattern of GENERIC_SECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { isJunk: true, reason: "markdown structure", confidence: 0.9 };
    }
  }

  if (EXACT_JUNK_PHRASES.has(normalized)) {
    return { isJunk: true, reason: "doc section title", confidence: 0.95 };
  }

  if (isMostlyFieldLabel(trimmed)) {
    return { isJunk: true, reason: "field label", confidence: 0.9 };
  }

  if (/^docs\/[\w/-]+$/.test(trimmed)) {
    return { isJunk: true, reason: "source file path", confidence: 0.95 };
  }

  if (lacksActionableContent(trimmed) && trimmed.length < 20) {
    return { isJunk: true, reason: "too short / no actionable work", confidence: 0.75 };
  }

  if (rawText) {
    const headingOnly =
      normalizeForMatch(rawText.split("\n")[0] ?? "") === normalized &&
      rawText.length < 120 &&
      !/\b(add|fix|build|implement|investigate|send|create|update|remove|refactor|migrate)\b/i.test(
        trimmed,
      );
    if (headingOnly && EXACT_JUNK_PHRASES.has(normalized)) {
      return { isJunk: true, reason: "section heading with no body", confidence: 0.85 };
    }
  }

  return { isJunk: false, reason: "actionable item", confidence: 0.6 };
}

export function scoreItemQuality(
  title: string,
  rawText: string,
  junkVerdict: JunkVerdict,
): number {
  if (junkVerdict.isJunk) return Math.max(0, 0.2 - junkVerdict.confidence * 0.1);

  let score = 0.5;
  const lower = title.toLowerCase();

  if (title.length >= 15 && title.length <= 80) score += 0.15;
  if (/\b(fails?|broken|bug|regression|implement|add|build|fix|migrate|handoff|flow|rail|pipeline)\b/i.test(lower)) {
    score += 0.15;
  }
  if (rawText.length > 80) score += 0.1;
  if (/→|->/.test(title)) score += 0.05;
  if (title.includes("...")) score -= 0.1;
  if (/^docs\//.test(title)) score -= 0.3;

  return Math.min(1, Math.max(0, Number(score.toFixed(2))));
}
