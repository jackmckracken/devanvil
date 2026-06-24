import type { DevItemStatus, ItemType, Priority } from "@/generated/prisma/client";

const statusStyles: Record<DevItemStatus, string> = {
  captured: "bg-slate-100 text-slate-700",
  triaged: "bg-blue-100 text-blue-800",
  approved: "bg-emerald-100 text-emerald-800",
  in_build: "bg-amber-100 text-amber-900",
  shipped: "bg-green-100 text-green-900",
  duplicate: "bg-orange-100 text-orange-900",
  rejected: "bg-red-100 text-red-800",
  archived: "bg-gray-100 text-gray-600",
};

const typeStyles: Record<ItemType, string> = {
  feature: "bg-indigo-100 text-indigo-800",
  bug: "bg-red-100 text-red-800",
  regression: "bg-rose-100 text-rose-900",
  decision: "bg-purple-100 text-purple-800",
  question: "bg-cyan-100 text-cyan-900",
  chore: "bg-yellow-100 text-yellow-900",
  opportunity: "bg-teal-100 text-teal-900",
};

const priorityStyles: Record<Priority, string> = {
  unset: "bg-gray-100 text-gray-600",
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-900",
  urgent: "bg-red-100 text-red-900",
};

function Badge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: DevItemStatus }) {
  return <Badge label={status.replace("_", " ")} className={statusStyles[status]} />;
}

export function TypeBadge({ type }: { type: ItemType }) {
  return <Badge label={type} className={typeStyles[type]} />;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge label={priority} className={priorityStyles[priority]} />;
}
