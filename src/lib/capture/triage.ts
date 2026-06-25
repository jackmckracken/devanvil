import { isInvestmentInput } from "@/lib/investments/classify";
import type { TriageSuggestion } from "@/lib/capture/types";

const BUG_PATTERNS = [
  /\b(broken|bug|crash|error|regression|doesn't work|does not work)\b/i,
  /\bflash(es|ing)?\b/i,
  /\bjitter(y)?\b/i,
];

const AUDIT_PATTERNS = [
  /\baudit\b/i,
  /\breview\b/i,
  /\binventory\b/i,
  /\bbeta\s+readiness\b/i,
  /\bpolish\b/i,
];

const ARCHITECT_PATTERNS = [
  /^i\s+(want|think|noticed|feel|wonder|wish)\b/i,
  /^we\s+(need|should|want|could)\b/i,
  /^what\s+if\b/i,
  /^artists\s+(need|should)\b/i,
  /\bnew\s+(domain|concept|object)\b/i,
  /\bcreative\s+investment/i,
  /\bwe\s+should\s+rethink\b/i,
  /\bthis\s+belongs\s+in\b/i,
];

/** Suggestions only — never auto-routes at capture time. */
export function suggestTriageMode(text: string): TriageSuggestion | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (BUG_PATTERNS.some((p) => p.test(trimmed))) {
    return { mode: "bug", reason: "Sounds like a known defect or symptom" };
  }

  if (AUDIT_PATTERNS.some((p) => p.test(trimmed))) {
    return { mode: "audit", reason: "Sounds like a quality or readiness review" };
  }

  if (isInvestmentInput(trimmed)) {
    return { mode: "investment", reason: "Sounds like capability-building, not a feature" };
  }

  if (ARCHITECT_PATTERNS.some((p) => p.test(trimmed))) {
    return { mode: "architect", reason: "Sounds like a new idea needing interpretation" };
  }

  return null;
}
