import Link from "next/link";
import type { PortfolioInvestment } from "@/lib/initiatives/portfolio";

export function InvestmentCard({ investment }: { investment: PortfolioInvestment }) {
  const { initiative, thesis, health } = investment;

  return (
    <Link
      href={`/initiatives/${initiative.id}`}
      className="group block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-orange-700">
        {initiative.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{thesis}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-lg bg-zinc-50 px-2.5 py-2">
          <p className="text-zinc-400">Cost</p>
          <p className="font-medium text-zinc-700">{health.engineeringCost}</p>
        </div>
        <div className="rounded-lg bg-zinc-50 px-2.5 py-2">
          <p className="text-zinc-400">Confidence</p>
          <p className="font-medium text-zinc-700">{health.confidence}%</p>
        </div>
        <div className="rounded-lg bg-zinc-50 px-2.5 py-2">
          <p className="text-zinc-400">Momentum</p>
          <p className="font-medium capitalize text-zinc-700">{health.momentum}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-orange-700">
          {health.investmentLevel}
        </span>
        {initiative.blockers.length > 0 && (
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">
            {initiative.blockers[0]}
          </span>
        )}
      </div>
    </Link>
  );
}

export function InvestmentList({
  investments,
  emptyMessage,
}: {
  investments: PortfolioInvestment[];
  emptyMessage: string;
}) {
  if (investments.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {investments.map((inv) => (
        <InvestmentCard key={inv.initiative.id} investment={inv} />
      ))}
    </div>
  );
}
