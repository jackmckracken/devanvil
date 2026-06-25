import type { InvestmentCategory } from "@/generated/prisma/client";

export type CapabilityFamily = "technical" | "creative" | "performance" | "business";

export type ArchitectEvidence = {
  completedInvestments: number;
  totalInvestments: number;
  capabilityFamilies: Record<CapabilityFamily, number>;
  completedWorkItems: number;
  captures: number;
  architectDiscussions: number;
  featureRequests: number;
  regressions: number;
};

export const EMPTY_FAMILIES: Record<CapabilityFamily, number> = {
  technical: 0,
  creative: 0,
  performance: 0,
  business: 0,
};

export function mapCategoryToFamily(
  category: InvestmentCategory,
  title = "",
): CapabilityFamily {
  const lower = title.toLowerCase();
  if (category === "business" || category === "relationships") return "business";
  if (category === "health") return "performance";
  if (category === "environment") return "performance";
  if (category === "learning" || category === "infrastructure") return "technical";
  if (category === "experimentation") {
    if (/\b(sdk|code|mcp|api|framework|ci|automation)\b/i.test(lower)) return "technical";
    return "creative";
  }
  return "technical";
}

export function familyEvidenceRows(
  families: Record<CapabilityFamily, number>,
): { label: string; count: number }[] {
  return [
    { label: "Technical", count: families.technical },
    { label: "Creative", count: families.creative },
    { label: "Performance", count: families.performance },
    { label: "Business", count: families.business },
  ];
}

export function inferFamilyFromInvestment(
  category: InvestmentCategory,
  title: string,
  capabilityTarget: string | null,
): CapabilityFamily {
  const target = (capabilityTarget ?? "").toLowerCase();
  if (/\btechnical\b/i.test(target)) return "technical";
  if (/\bcreative\b/i.test(target)) return "creative";
  if (/\bperformance\b/i.test(target)) return "performance";
  if (/\bbusiness\b/i.test(target)) return "business";
  return mapCategoryToFamily(category, title);
}
