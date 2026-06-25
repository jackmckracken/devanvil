import Link from "next/link";
import type { MomentumSnapshot } from "@/lib/investments/momentum";

export function MomentumPanel({ momentum, projectSlug }: { momentum: MomentumSnapshot; projectSlug: string }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">Today&apos;s Momentum</h2>
        <Link href={`/investments?project=${projectSlug}`} className="text-xs text-orange-600 hover:underline">
          Investments →
        </Link>
      </div>
      <p className="mt-1 text-sm text-zinc-500">{momentum.message}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Execution
          </p>
          {momentum.execution.length === 0 ? (
            <p className="text-sm text-zinc-400">Nothing ready to build</p>
          ) : (
            <ul className="space-y-1.5">
              {momentum.execution.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-300">○</span>
                  <Link href={item.href} className="text-zinc-800 hover:text-orange-600">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
            Investments
          </p>
          {momentum.investments.length === 0 ? (
            <p className="text-sm text-zinc-400">No active investments</p>
          ) : (
            <ul className="space-y-1.5">
              {momentum.investments.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-sm">
                  <span className="text-emerald-400">○</span>
                  <Link href={item.href} className="text-zinc-800 hover:text-emerald-600">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {(momentum.completedThisWeek > 0 || momentum.investmentsCompletedThisWeek > 0) && (
        <div className="mt-4 flex gap-4 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
          {momentum.completedThisWeek > 0 && (
            <span>{momentum.completedThisWeek} shipped this week</span>
          )}
          {momentum.investmentsCompletedThisWeek > 0 && (
            <span className="text-emerald-600">
              {momentum.investmentsCompletedThisWeek} investment
              {momentum.investmentsCompletedThisWeek !== 1 ? "s" : ""} completed
            </span>
          )}
        </div>
      )}
    </section>
  );
}
