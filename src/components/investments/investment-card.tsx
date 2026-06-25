import Link from "next/link";
import type { InvestmentSummary } from "@/lib/investments/queries";
import { getCategoryMeta, LEVERAGE_LABELS } from "@/lib/investments/categories";

const STATUS_COLORS: Record<string, string> = {
  captured: "bg-zinc-100 text-zinc-600",
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-orange-100 text-orange-700",
  completed: "bg-emerald-100 text-emerald-700",
  archived: "bg-zinc-100 text-zinc-400",
};

export function InvestmentCard({
  investment,
  compact = false,
}: {
  investment: InvestmentSummary;
  compact?: boolean;
}) {
  const category = getCategoryMeta(investment.category);

  return (
    <Link
      href={`/investments/${investment.id}`}
      className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-zinc-900">{investment.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[investment.status] ?? ""}`}
        >
          {investment.status.replace(/_/g, " ")}
        </span>
      </div>

      {!compact && investment.capabilityTarget && (
        <p className="mt-2 text-sm text-emerald-800">
          → {investment.capabilityTarget}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
        <span className="rounded bg-zinc-100 px-2 py-0.5">{category.label}</span>
        <span className="rounded bg-zinc-100 px-2 py-0.5">
          {LEVERAGE_LABELS[investment.leverage]}
        </span>
        {investment.estimatedHours && (
          <span className="rounded bg-zinc-100 px-2 py-0.5">
            ~{investment.estimatedHours}h
          </span>
        )}
      </div>

      {!compact && investment.compoundingValue && (
        <p className="mt-2 text-xs text-zinc-400 line-clamp-2">
          {investment.compoundingValue}
        </p>
      )}
    </Link>
  );
}
