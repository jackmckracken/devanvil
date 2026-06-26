import type {
  InitiativePriority,
  InitiativeStatus,
  StrategicValue,
} from "@/generated/prisma/client";
import type { ScoredInitiative } from "@/lib/initiatives/types";

export type HealthLevel = "low" | "medium" | "high";

export type InvestmentHealth = {
  momentum: HealthLevel;
  confidence: number;
  risk: HealthLevel;
  progress: number;
  investmentLevel: string;
  engineeringCost: string;
  estimatedUserValue: string;
};

const STRATEGIC_USER_VALUE: Record<StrategicValue, string> = {
  beta_critical: "High — beta retention & wow moments",
  launch_critical: "High — launch readiness",
  growth: "Medium-high — user acquisition & retention",
  infrastructure: "Medium — technical leverage",
  delight: "Medium — user satisfaction",
  research: "Low-medium — future enablement",
  future_vision: "Low — exploratory",
};

const INVESTMENT_LEVEL: Record<InitiativeStatus, string> = {
  active: "Full investment",
  next: "Queued — ready to activate",
  proposed: "Under consideration",
  paused: "Paused",
  completed: "Realized",
  archived: "Archived",
};

function healthFromScore(score: number): HealthLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function computeInvestmentHealth(
  initiative: ScoredInitiative,
  shippedCount: number,
  blockedCount: number,
  mentalModelConfidence?: number,
): InvestmentHealth {
  const total = initiative.itemCount || 1;
  const progress = Math.round((shippedCount / total) * 100);

  const momentumScore =
    (initiative.inBuildCount > 0 ? 40 : 0) +
    (progress > 0 ? 30 : 0) +
    (initiative.status === "active" ? 30 : initiative.status === "next" ? 15 : 0);

  const riskScore =
    initiative.blockers.length * 25 +
    initiative.regressionCount * 20 +
    blockedCount * 15 +
    (initiative.status === "paused" ? 20 : 0);

  const confidence =
    mentalModelConfidence ??
  clamp(
    initiative.priorityScore * 0.6 +
      (initiative.blockers.length === 0 ? 20 : 0) +
      (progress > 0 ? 10 : 0),
    0,
    100,
  );

  const itemCost = initiative.itemCount;
  const engineeringCost =
    itemCost === 0
      ? "Not yet scoped"
      : itemCost <= 2
        ? "~1–2 days"
        : itemCost <= 5
          ? "~1 week"
          : itemCost <= 10
            ? "~2–3 weeks"
            : "~1+ month";

  const riskLevel: HealthLevel =
    riskScore >= 60 ? "high" : riskScore >= 25 ? "medium" : "low";

  return {
    momentum: healthFromScore(momentumScore),
    confidence: Math.round(confidence),
    risk: riskLevel,
    progress,
    investmentLevel: INVESTMENT_LEVEL[initiative.status],
    engineeringCost,
    estimatedUserValue: STRATEGIC_USER_VALUE[initiative.strategicValue],
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function priorityToRisk(
  priority: InitiativePriority,
  blockers: string[],
): HealthLevel {
  if (blockers.length > 2 || priority === "critical") return "high";
  if (blockers.length > 0 || priority === "high") return "medium";
  return "low";
}
