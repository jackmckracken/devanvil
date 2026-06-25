import { detectProtectedDomains } from "@/lib/protected-domains/detection";
import { deriveArchitecturalSummary } from "@/lib/workflow/intent";
import type { BugAnalysis } from "@/lib/bug/types";

export function generateAcceptanceCriteria(
  text: string,
  summary: string,
  hasProtectedDomain: boolean,
): string[] {
  const criteria = [
    `Reproduce the reported behavior: ${summary}`,
    "Fix addresses the root cause without introducing regressions in the affected surface",
  ];

  if (hasProtectedDomain) {
    criteria.push(
      "Protected domain contracts and visual/runtime evidence requirements are satisfied",
    );
  }

  criteria.push(
    "Manual verification completed on the target environment",
    "No new console errors or layout breakage in adjacent UI",
  );

  if (/\bflash(es|ing)?\b/i.test(text)) {
    criteria.push("No visible flash or flicker on mount, navigation, or state change");
  }

  if (/\bhover\b/i.test(text)) {
    criteria.push("Hover states are stable, intentional, and match design intent");
  }

  return criteria;
}

export async function analyzeBugCapture(
  text: string,
  projectSlug: string,
): Promise<BugAnalysis> {
  const { title, summary, intent } = deriveArchitecturalSummary(text);
  const domains = await detectProtectedDomains({ text, projectSlug });
  const hasProtected = domains.some(
    (d) =>
      d.domain.protectionLevel === "protected" ||
      d.domain.protectionLevel === "locked",
  );

  return {
    title,
    summary,
    symptom: intent,
    acceptanceCriteria: generateAcceptanceCriteria(text, summary, hasProtected),
    affectedDomains: domains,
    recommendedNextStep:
      "Work item is ready for Forge. Do not expand scope beyond the reported defect.",
  };
}
