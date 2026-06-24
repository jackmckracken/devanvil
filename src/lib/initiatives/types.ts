import type {
  InitiativePriority,
  InitiativeStatus,
  StrategicValue,
} from "@/generated/prisma/client";

export const INITIATIVE_STATUS_LABELS: Record<InitiativeStatus, string> = {
  proposed: "Proposed",
  active: "Active",
  next: "Next",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

export const INITIATIVE_PRIORITY_LABELS: Record<InitiativePriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const STRATEGIC_VALUE_LABELS: Record<StrategicValue, string> = {
  beta_critical: "Beta Critical",
  launch_critical: "Launch Critical",
  growth: "Growth",
  delight: "Delight",
  infrastructure: "Infrastructure",
  research: "Research",
  future_vision: "Future Vision",
};

export const PORTFOLIO_LIMITS = {
  activeInitiatives: 5,
  criticalInitiatives: 3,
  inBuildInitiatives: 3,
} as const;

export type PortfolioHealth = {
  activeCount: number;
  nextCount: number;
  backlogSize: number;
  criticalCount: number;
  regressionCount: number;
  inBuildCount: number;
  warnings: string[];
};

export type ScoredInitiative = {
  id: string;
  title: string;
  description: string | null;
  status: InitiativeStatus;
  priority: InitiativePriority;
  strategicValue: StrategicValue;
  targetRelease: string | null;
  scoreOverride: number | null;
  priorityScore: number;
  itemCount: number;
  regressionCount: number;
  duplicateCount: number;
  inBuildCount: number;
  blockers: string[];
  dependencies: string[];
};

export type PortfolioAnswer = {
  topInitiatives: ScoredInitiative[];
  whyTheyMatter: string[];
  blockers: string[];
  dependencies: string[];
};
