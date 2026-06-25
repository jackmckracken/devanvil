import type { ProtectionLevel, RegressionStatus } from "@/generated/prisma/client";

const protectionStyles: Record<ProtectionLevel, string> = {
  advisory: "bg-slate-100 text-slate-700",
  guarded: "bg-amber-100 text-amber-900",
  protected: "bg-orange-100 text-orange-900",
  locked: "bg-red-100 text-red-900",
};

const regressionStyles: Record<RegressionStatus, string> = {
  passing: "bg-emerald-100 text-emerald-800",
  failing: "bg-red-100 text-red-800",
  unknown: "bg-gray-100 text-gray-600",
  not_run: "bg-yellow-100 text-yellow-900",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${className}`}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}

export function ProtectionLevelBadge({ level }: { level: ProtectionLevel }) {
  return <Badge label={level} className={protectionStyles[level]} />;
}

export function RegressionStatusBadge({ status }: { status: RegressionStatus }) {
  return <Badge label={status} className={regressionStyles[status]} />;
}
