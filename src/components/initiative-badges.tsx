import type {
  InitiativePriority,
  InitiativeStatus,
  StrategicValue,
} from "@/generated/prisma/client";
import {
  INITIATIVE_PRIORITY_LABELS,
  INITIATIVE_STATUS_LABELS,
  STRATEGIC_VALUE_LABELS,
} from "@/lib/initiatives/types";

const statusStyles: Record<InitiativeStatus, string> = {
  proposed: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-800",
  next: "bg-blue-100 text-blue-800",
  paused: "bg-amber-100 text-amber-900",
  completed: "bg-green-100 text-green-900",
  archived: "bg-gray-100 text-gray-600",
};

const priorityStyles: Record<InitiativePriority, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-900",
  critical: "bg-red-100 text-red-900",
};

const strategicStyles: Record<StrategicValue, string> = {
  beta_critical: "bg-rose-100 text-rose-900",
  launch_critical: "bg-red-100 text-red-800",
  growth: "bg-teal-100 text-teal-900",
  delight: "bg-purple-100 text-purple-800",
  infrastructure: "bg-indigo-100 text-indigo-800",
  research: "bg-cyan-100 text-cyan-900",
  future_vision: "bg-violet-100 text-violet-800",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export function InitiativeStatusBadge({ status }: { status: InitiativeStatus }) {
  return (
    <Badge label={INITIATIVE_STATUS_LABELS[status]} className={statusStyles[status]} />
  );
}

export function InitiativePriorityBadge({ priority }: { priority: InitiativePriority }) {
  return (
    <Badge
      label={INITIATIVE_PRIORITY_LABELS[priority]}
      className={priorityStyles[priority]}
    />
  );
}

export function StrategicValueBadge({ value }: { value: StrategicValue }) {
  return (
    <Badge label={STRATEGIC_VALUE_LABELS[value]} className={strategicStyles[value]} />
  );
}

export function ScoreBadge({ score, overridden }: { score: number; overridden?: boolean }) {
  const color =
    score >= 80
      ? "bg-emerald-100 text-emerald-900"
      : score >= 60
        ? "bg-amber-100 text-amber-900"
        : "bg-slate-100 text-slate-700";

  return (
    <Badge
      label={overridden ? `${score} (override)` : String(score)}
      className={color}
    />
  );
}
