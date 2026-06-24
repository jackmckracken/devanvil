import Link from "next/link";
import type { ScoredInitiative } from "@/lib/initiatives/types";
import {
  InitiativePriorityBadge,
  InitiativeStatusBadge,
  ScoreBadge,
  StrategicValueBadge,
} from "@/components/initiative-badges";

export function InitiativeCard({ initiative }: { initiative: ScoredInitiative }) {
  return (
    <Link
      href={`/initiatives/${initiative.id}`}
      className="block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-zinc-900">
            {initiative.title}
          </h3>
          {initiative.description && (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
              {initiative.description}
            </p>
          )}
        </div>
        <ScoreBadge
          score={initiative.priorityScore}
          overridden={initiative.scoreOverride !== null}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <InitiativeStatusBadge status={initiative.status} />
        <InitiativePriorityBadge priority={initiative.priority} />
        <StrategicValueBadge value={initiative.strategicValue} />
      </div>

      <div className="mt-3 flex gap-4 text-xs text-zinc-500">
        <span>{initiative.itemCount} items</span>
        {initiative.inBuildCount > 0 && (
          <span className="text-amber-700">{initiative.inBuildCount} in build</span>
        )}
        {initiative.regressionCount > 0 && (
          <span className="text-rose-700">{initiative.regressionCount} regressions</span>
        )}
        {initiative.targetRelease && <span>Target: {initiative.targetRelease}</span>}
      </div>

      {initiative.blockers.length > 0 && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {initiative.blockers[0]}
        </div>
      )}
    </Link>
  );
}

export function InitiativeList({
  initiatives,
  emptyMessage,
}: {
  initiatives: ScoredInitiative[];
  emptyMessage: string;
}) {
  if (initiatives.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {initiatives.map((initiative) => (
        <InitiativeCard key={initiative.id} initiative={initiative} />
      ))}
    </div>
  );
}
