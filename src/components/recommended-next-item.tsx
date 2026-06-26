import Link from "next/link";
import type { RankedReadyItem } from "@/lib/initiatives/ready-items";

function estimateEffort(item: RankedReadyItem): string {
  if (item.priority === "urgent") return "~2 hours";
  if (item.priority === "high") return "~4 hours";
  if (item.status === "approved") return "~4–6 hours";
  return "~1 day";
}

function estimateRisk(item: RankedReadyItem): string {
  if (item.blocked) return "High — blocked";
  if (item.blockers.length > 0) return "Medium";
  return "Low";
}

export function RecommendedNextItemPanel({
  item,
  recommendedAction,
}: {
  item: RankedReadyItem;
  recommendedAction: string;
}) {
  const whyReasons = item.rankingReasons.slice(0, 3);
  const dependentCount = item.blockers.length;

  return (
    <section className="rounded-xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
        If I only worked two hours today...
      </p>
      <Link
        href={`/queue/${item.id}`}
        className="mt-2 block text-2xl font-semibold tracking-tight text-orange-950 hover:underline"
      >
        {item.title}
      </Link>

      {item.initiative && (
        <p className="mt-1 text-sm text-orange-800">
          Investment:{" "}
          <Link
            href={`/initiatives/${item.initiative.id}`}
            className="font-medium hover:underline"
          >
            {item.initiative.title}
          </Link>
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600">
            Why
          </p>
          <ul className="mt-1.5 space-y-0.5 text-sm text-orange-900">
            {whyReasons.map((reason) => (
              <li key={reason}>· {reason}</li>
            ))}
            {dependentCount > 0 && (
              <li>· {dependentCount} dependent feature{dependentCount !== 1 ? "s" : ""} waiting</li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600">
            Estimated Effort
          </p>
          <p className="mt-1.5 text-sm font-medium text-orange-900">
            {estimateEffort(item)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600">
            Risk
          </p>
          <p className="mt-1.5 text-sm font-medium text-orange-900">
            {estimateRisk(item)}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-orange-700">
        Branch: <code className="rounded bg-orange-100 px-1">{item.suggestedBranch}</code>
      </p>
      <p className="mt-1 text-sm text-orange-800">{recommendedAction}</p>
    </section>
  );
}
