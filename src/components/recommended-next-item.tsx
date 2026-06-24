import Link from "next/link";
import type { RankedReadyItem } from "@/lib/initiatives/ready-items";

export function RecommendedNextItemPanel({
  item,
  recommendedAction,
}: {
  item: RankedReadyItem;
  recommendedAction: string;
}) {
  return (
    <section className="rounded-xl border-2 border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
            Recommended Next Item
          </p>
          <Link
            href={`/queue/${item.id}`}
            className="mt-1 block text-xl font-semibold text-orange-950 hover:underline"
          >
            {item.title}
          </Link>
          {item.initiative && (
            <p className="mt-1 text-sm text-orange-800">
              Initiative:{" "}
              <Link
                href={`/initiatives/${item.initiative.id}`}
                className="font-medium hover:underline"
              >
                {item.initiative.title}
              </Link>
            </p>
          )}
          <ul className="mt-2 space-y-0.5 text-sm text-orange-800">
            {item.rankingReasons.map((reason) => (
              <li key={reason}>· {reason}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-orange-700">
            Branch: <code className="rounded bg-orange-100 px-1">{item.suggestedBranch}</code>
          </p>
          <p className="mt-2 text-sm font-medium text-orange-900">{recommendedAction}</p>
        </div>
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full bg-orange-600 text-white">
          <span className="text-lg font-bold leading-none">{item.score}</span>
          <span className="text-[10px] uppercase">score</span>
        </div>
      </div>
    </section>
  );
}
