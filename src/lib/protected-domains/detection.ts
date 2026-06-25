import { getProtectedDomainBySlug, listProtectedDomains } from "@/lib/protected-domains/queries";
import type {
  ForgeProtectedDomainWarning,
  ProtectedDomainChecklist,
  ProtectedDomainDetection,
} from "@/lib/protected-domains/types";

function normalizeText(text: string): string {
  return text.toLowerCase();
}

function matchKeywords(
  text: string,
  keywords: string[],
): string[] {
  const haystack = normalizeText(text);
  return keywords.filter((keyword) => haystack.includes(keyword.toLowerCase()));
}

function matchPathPatterns(
  paths: string[],
  patterns: string[],
): string[] {
  const matched: string[] = [];
  for (const path of paths) {
    const normalized = path.toLowerCase();
    for (const pattern of patterns) {
      const regex = new RegExp(
        pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*"),
        "i",
      );
      if (regex.test(normalized)) {
        matched.push(pattern);
      }
    }
  }
  return [...new Set(matched)];
}

function assessRisk(
  protectionLevel: string,
  matchedKeywordCount: number,
  prohibitedHits: number,
): "low" | "medium" | "high" {
  if (protectionLevel === "locked" || prohibitedHits > 0) return "high";
  if (protectionLevel === "protected" || matchedKeywordCount >= 3) return "medium";
  return "low";
}

function detectProhibitedWork(
  text: string,
  domainSlug: string,
  domainName: string,
  blockedChanges: string[],
): ForgeProtectedDomainWarning["prohibitedWork"] {
  const haystack = normalizeText(text);
  const hits: ForgeProtectedDomainWarning["prohibitedWork"] = [];

  for (const change of blockedChanges) {
    const tokens = change.toLowerCase().split(/\s+/);
    const primary = tokens[0] ?? change;
    if (haystack.includes(primary) || haystack.includes(change.toLowerCase())) {
      hits.push({
        domainSlug,
        domainName,
        change,
        requires: ["ADR", "Architecture review", "Protected Domain approval"],
      });
    }
  }

  return hits;
}

export async function detectProtectedDomains(input: {
  text: string;
  paths?: string[];
  projectSlug?: string;
}): Promise<ProtectedDomainDetection[]> {
  const domains = await listProtectedDomains(input.projectSlug);
  const pathList = input.paths ?? [];
  const detections: ProtectedDomainDetection[] = [];

  for (const domain of domains) {
    const detail = await getProtectedDomainBySlug(domain.slug);
    if (!detail) continue;

    const matchedKeywords = matchKeywords(input.text, detail.keywords);
    const matchedPaths = matchPathPatterns(pathList, detail.pathPatterns);

    if (matchedKeywords.length === 0 && matchedPaths.length === 0) {
      continue;
    }

    const blockedChanges = detail.extensionPoints
      .filter((e) => e.category === "requires_adr")
      .map((e) => e.name);

    const requiredGates = detail.changeGates
      .filter((g) => g.required)
      .map((g) => g.name);

    detections.push({
      domain,
      matchedKeywords,
      matchedPaths,
      blockedChanges,
      requiredGates,
      risk: assessRisk(
        domain.protectionLevel,
        matchedKeywords.length + matchedPaths.length,
        0,
      ),
      artifactsToLoad: detail.artifacts,
    });
  }

  return detections.sort((a, b) => {
    const levelOrder = { locked: 4, protected: 3, guarded: 2, advisory: 1 };
    return (
      levelOrder[b.domain.protectionLevel] - levelOrder[a.domain.protectionLevel]
    );
  });
}

export async function analyzeForgeTask(input: {
  text: string;
  paths?: string[];
  projectSlug?: string;
}): Promise<ForgeProtectedDomainWarning> {
  const detections = await detectProtectedDomains(input);
  const prohibitedWork: ForgeProtectedDomainWarning["prohibitedWork"] = [];

  for (const detection of detections) {
    const hits = detectProhibitedWork(
      input.text,
      detection.domain.slug,
      detection.domain.name,
      detection.blockedChanges,
    );
    prohibitedWork.push(...hits);
    if (hits.length > 0) {
      detection.risk = "high";
    }
  }

  return {
    detected: detections.length > 0,
    domains: detections,
    prohibitedWork,
  };
}

export async function getProtectedDomainChecklist(
  slug: string,
  gateResults?: Record<string, boolean>,
): Promise<ProtectedDomainChecklist | null> {
  const domain = await getProtectedDomainBySlug(slug);
  if (!domain) return null;

  const gates = domain.changeGates.map((gate) => ({
    name: gate.name,
    required: gate.required,
    passed: gateResults?.[gate.name] ?? false,
  }));

  const requiredGates = gates.filter((g) => g.required);
  const allRequiredPassed =
    requiredGates.length === 0 || requiredGates.every((g) => g.passed);

  const canMarkComplete =
    domain.protectionLevel === "advisory"
      ? true
      : allRequiredPassed && domain.recentViolations === 0;

  return {
    domainSlug: domain.slug,
    domainName: domain.name,
    protectionLevel: domain.protectionLevel,
    gates,
    allRequiredPassed,
    canMarkComplete,
  };
}

export function formatForgeWarning(
  warning: ForgeProtectedDomainWarning,
): string {
  if (!warning.detected) {
    return "";
  }

  const lines: string[] = ["## Protected Domain Detected", ""];

  for (const detection of warning.domains) {
    lines.push(
      `### ${detection.domain.name}`,
      "",
      `- **Protection Level:** ${detection.domain.protectionLevel}`,
      `- **Owner:** ${detection.domain.owner}`,
      `- **Risk:** ${detection.risk}`,
      "",
    );

    if (detection.matchedKeywords.length > 0) {
      lines.push(
        `**Matched keywords:** ${detection.matchedKeywords.join(", ")}`,
        "",
      );
    }

    if (detection.matchedPaths.length > 0) {
      lines.push(
        `**Matched paths:** ${detection.matchedPaths.join(", ")}`,
        "",
      );
    }

    if (detection.artifactsToLoad.length > 0) {
      lines.push("**Forge loaded:**");
      for (const artifact of detection.artifactsToLoad) {
        const path = artifact.path ? ` (${artifact.path})` : "";
        lines.push(`- ✓ ${artifact.title}${path}`);
      }
      lines.push("");
    }

    if (detection.requiredGates.length > 0) {
      lines.push("**Required gates before merge:**");
      for (const gate of detection.requiredGates) {
        lines.push(`- ${gate}`);
      }
      lines.push("");
    }

    if (detection.blockedChanges.length > 0) {
      lines.push("**Changes requiring ADR:**");
      for (const change of detection.blockedChanges) {
        lines.push(`- ${change}`);
      }
      lines.push("");
    }
  }

  if (warning.prohibitedWork.length > 0) {
    lines.push("### ⚠ Prohibited Work Detected", "");
    for (const item of warning.prohibitedWork) {
      lines.push(
        `**${item.change}** in ${item.domainName} requires:`,
        ...item.requires.map((r) => `- ${r}`),
        "",
        "Continue only with explicit approval.",
        "",
      );
    }
  }

  lines.push(
    "Before planning or modifying code in a Protected Domain, load contracts, ADRs, inventories, and golden masters listed above.",
    "Forge must not mark work complete until all required change gates pass.",
  );

  return lines.join("\n");
}
