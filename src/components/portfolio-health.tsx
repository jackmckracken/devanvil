import type { PortfolioHealth } from "@/lib/initiatives/types";
import { PORTFOLIO_LIMITS } from "@/lib/initiatives/types";

function StatCard({
  label,
  value,
  limit,
  warn,
}: {
  label: string;
  value: number;
  limit?: number;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        warn ? "border-amber-300 bg-amber-50" : "border-zinc-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${warn ? "text-amber-900" : "text-zinc-900"}`}>
        {value}
        {limit !== undefined && (
          <span className="text-sm font-normal text-zinc-400"> / {limit}</span>
        )}
      </p>
    </div>
  );
}

export function PortfolioHealthPanel({ health }: { health: PortfolioHealth }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Active"
          value={health.activeCount}
          limit={PORTFOLIO_LIMITS.activeInitiatives}
          warn={health.activeCount > PORTFOLIO_LIMITS.activeInitiatives}
        />
        <StatCard label="Next Up" value={health.nextCount} />
        <StatCard label="Backlog" value={health.backlogSize} />
        <StatCard
          label="Critical"
          value={health.criticalCount}
          limit={PORTFOLIO_LIMITS.criticalInitiatives}
          warn={health.criticalCount > PORTFOLIO_LIMITS.criticalInitiatives}
        />
        <StatCard
          label="In Build"
          value={health.inBuildCount}
          limit={PORTFOLIO_LIMITS.inBuildInitiatives}
          warn={health.inBuildCount > PORTFOLIO_LIMITS.inBuildInitiatives}
        />
      </div>

      {health.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">Portfolio constraints exceeded</p>
          <ul className="mt-1 list-inside list-disc text-sm text-amber-800">
            {health.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {health.regressionCount > 0 && (
        <p className="text-sm text-rose-700">
          {health.regressionCount} open regression{health.regressionCount === 1 ? "" : "s"} across
          the portfolio
        </p>
      )}
    </div>
  );
}
