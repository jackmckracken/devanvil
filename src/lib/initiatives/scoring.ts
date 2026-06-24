import type {
  DevItemStatus,
  InitiativePriority,
  InitiativeStatus,
  ItemType,
  StrategicValue,
} from "@/generated/prisma/client";

export type InitiativeScoreInput = {
  strategicValue: StrategicValue;
  status: InitiativeStatus;
  priority: InitiativePriority;
  itemCount: number;
  duplicateCount: number;
  regressionCount: number;
  scoreOverride: number | null;
};

const STRATEGIC_VALUE_WEIGHTS: Record<StrategicValue, number> = {
  beta_critical: 95,
  launch_critical: 90,
  growth: 70,
  infrastructure: 60,
  delight: 45,
  research: 30,
  future_vision: 15,
};

const STATUS_WEIGHTS: Record<InitiativeStatus, number> = {
  active: 100,
  next: 80,
  proposed: 50,
  paused: 25,
  completed: 10,
  archived: 0,
};

const PRIORITY_WEIGHTS: Record<InitiativePriority, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computePriorityScore(input: InitiativeScoreInput): number {
  if (input.scoreOverride !== null) {
    return clamp(input.scoreOverride, 0, 100);
  }

  const strategic = STRATEGIC_VALUE_WEIGHTS[input.strategicValue] * 0.35;
  const status = STATUS_WEIGHTS[input.status] * 0.25;
  const priority = PRIORITY_WEIGHTS[input.priority] * 0.15;

  const clusterBonus = clamp(input.itemCount * 3, 0, 15);
  const duplicatePenalty = clamp(input.duplicateCount * 2, 0, 10);
  const regressionBonus = clamp(input.regressionCount * 5, 0, 15);

  const raw =
    strategic + status + priority + clusterBonus + regressionBonus - duplicatePenalty;

  return clamp(Math.round(raw), 0, 100);
}

export function extractBlockers(
  items: { status: DevItemStatus; title: string; itemType: ItemType }[],
): string[] {
  const blockers: string[] = [];

  const questions = items.filter((i) => i.itemType === "question");
  if (questions.length > 0) {
    blockers.push(`${questions.length} open question(s) need answers`);
  }

  const captured = items.filter((i) => i.status === "captured");
  if (captured.length > items.length * 0.5 && items.length > 2) {
    blockers.push("Most items still uncaptured/unreviewed");
  }

  const regressions = items.filter((i) => i.itemType === "regression");
  for (const reg of regressions.slice(0, 3)) {
    blockers.push(`Regression: ${reg.title}`);
  }

  return blockers;
}

export function extractDependencies(
  items: { title: string; normalizedSummary: string }[],
): string[] {
  const deps: string[] = [];
  const depPattern = /\b(depends on|blocked by|requires|needs)\b/i;

  for (const item of items) {
    if (depPattern.test(item.title) || depPattern.test(item.normalizedSummary)) {
      deps.push(item.title);
    }
  }

  return deps.slice(0, 5);
}

export function whyInitiativeMatters(
  strategicValue: StrategicValue,
  priority: InitiativePriority,
  itemCount: number,
): string {
  const valueLabel = strategicValue.replace(/_/g, " ");
  const parts = [`${valueLabel} strategic value`];

  if (priority === "critical" || priority === "high") {
    parts.push(`${priority} priority`);
  }

  if (itemCount > 0) {
    parts.push(`${itemCount} linked item${itemCount === 1 ? "" : "s"}`);
  }

  return parts.join(" · ");
}
