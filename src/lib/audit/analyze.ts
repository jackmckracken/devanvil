import { detectProtectedDomains } from "@/lib/protected-domains/detection";
import type { ProtectedDomainDetection } from "@/lib/protected-domains/types";
import { buildProtectionSummary } from "@/lib/workflow/brief";
import { deriveArchitecturalSummary } from "@/lib/workflow/intent";
import type { AuditScope } from "@/lib/audit/types";

const SUBSYSTEM_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /\bbloom\b/i, name: "Bloom" },
  { pattern: /\bworkbench\b/i, name: "Workbench" },
  { pattern: /\brunway\b/i, name: "Runway" },
  { pattern: /\bpractice\b/i, name: "Practice" },
  { pattern: /\bmomentum\b/i, name: "Momentum" },
  { pattern: /\bground\b/i, name: "Ground" },
  { pattern: /\benrich\b/i, name: "Enrich" },
  { pattern: /\bdashboard\b/i, name: "Dashboard" },
  { pattern: /\bhover\b/i, name: "Hover interactions" },
  { pattern: /\batom(s)?\b/i, name: "Atoms" },
  { pattern: /\bshortcut(s)?\b/i, name: "Shortcuts" },
  { pattern: /\bmemory\b/i, name: "Memory" },
  { pattern: /\binbox\b/i, name: "Inbox" },
  { pattern: /\bforge\b/i, name: "Forge" },
];

function detectTargetSubsystem(text: string, domains: ProtectedDomainDetection[]): string {
  for (const { pattern, name } of SUBSYSTEM_PATTERNS) {
    if (pattern.test(text)) return name;
  }
  if (domains[0]) return domains[0].domain.name;
  return "Unspecified subsystem";
}

function buildScopeAreas(text: string): string[] {
  const areas: string[] = [];
  const lower = text.toLowerCase();

  if (/\bhover\b|\binteraction\b|\bstate(s)?\b/i.test(lower)) {
    areas.push("Interaction states and transitions");
  }
  if (/\bscroll\b|\bmotion\b|\banimat/i.test(lower)) {
    areas.push("Motion, scroll, and performance feel");
  }
  if (/\bvisual\b|\blook\b|\bfeel\b|\bpolish\b|\bcramped\b/i.test(lower)) {
    areas.push("Visual polish and density");
  }
  if (/\bload\b|\bslow\b|\bperformance\b|\bflash/i.test(lower)) {
    areas.push("Performance and stability");
  }
  if (/\bconsisten/i.test(lower)) {
    areas.push("Cross-surface consistency");
  }
  if (/\baccessib/i.test(lower)) {
    areas.push("Accessibility and affordances");
  }
  if (/\bcontract\b|\bevidence\b|\bgolden\b/i.test(lower)) {
    areas.push("Contract and evidence alignment");
  }

  if (areas.length === 0) {
    areas.push("Subsystem quality against architectural intent");
    areas.push("UX completeness and edge cases");
  }

  return areas;
}

function buildPolishThemes(text: string, scopeAreas: string[]): string[] {
  const themes = new Set<string>();

  if (/\bhover\b/i.test(text)) themes.add("Hover interaction quality");
  if (/\bscroll\b/i.test(text)) themes.add("Scroll and motion feel");
  if (/\bflash/i.test(text)) themes.add("Mount and transition stability");
  if (/\bcramped\b|\bdensity\b/i.test(text)) themes.add("Layout density and breathing room");
  if (/\bconsisten/i.test(text)) themes.add("Cross-state consistency");
  if (/\bempty\b|\bloading\b/i.test(text)) themes.add("Empty and loading states");

  for (const area of scopeAreas) {
    themes.add(area);
  }

  if (themes.size === 0) {
    themes.add("General polish pass");
  }

  return [...themes].slice(0, 6);
}

function buildEvaluationQuestions(
  subsystem: string,
  domains: ProtectedDomainDetection[],
): string[] {
  const questions = [
    `Does ${subsystem} match its architectural intent and user promise?`,
    "Where does reality diverge from contracts, records, or golden masters?",
    "Which issues are systemic themes vs one-off defects?",
    "What should be grouped into a polish initiative instead of filed as individual bugs?",
  ];

  if (domains.some((d) => d.domain.protectionLevel === "protected")) {
    questions.push("Are protected domain gates and evidence requirements satisfied?");
  }

  questions.push("What is beta-critical vs can wait until after launch?");

  return questions;
}

export async function analyzeAuditCapture(
  text: string,
  projectSlug: string,
): Promise<AuditScope> {
  const { title, summary } = deriveArchitecturalSummary(text);
  const domains = await detectProtectedDomains({ text, projectSlug });
  const protection = buildProtectionSummary(domains);
  const targetSubsystem = detectTargetSubsystem(text, domains);
  const scopeAreas = buildScopeAreas(text);
  const polishThemes = buildPolishThemes(text, scopeAreas);

  let recommendedNextStep =
    "Review audit scope, then create a Polish Initiative with themed epics — not individual bugs.";

  if (protection.highestLevel === "protected" || protection.highestLevel === "locked") {
    recommendedNextStep +=
      " Protected domain evidence and contracts must be included in the audit.";
  }

  return {
    title: title.startsWith("Audit") ? title : `Audit: ${title}`,
    targetSubsystem,
    summary,
    affectedDomains: domains,
    scopeAreas,
    evaluationQuestions: buildEvaluationQuestions(targetSubsystem, domains),
    polishThemes,
    recommendedNextStep,
  };
}

export function buildPolishInitiativeDescription(scope: AuditScope, captureId: string): string {
  const lines = [
    `Polish initiative derived from audit of **${scope.targetSubsystem}**.`,
    "",
    `Source capture: \`${captureId}\``,
    "",
    "## Audit scope",
    "",
    scope.summary,
    "",
    "## Scope areas",
    "",
    ...scope.scopeAreas.map((area) => `- ${area}`),
    "",
    "## Themed epics (not individual bugs)",
    "",
    ...scope.polishThemes.map((theme) => `- ${theme}`),
    "",
    "## Evaluation questions",
    "",
    ...scope.evaluationQuestions.map((q) => `- ${q}`),
    "",
    scope.recommendedNextStep,
  ];

  if (scope.affectedDomains.length > 0) {
    lines.push("", "## Affected domains", "");
    for (const d of scope.affectedDomains) {
      lines.push(`- **${d.domain.name}** (${d.domain.protectionLevel})`);
    }
  }

  return lines.join("\n");
}
