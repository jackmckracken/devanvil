import Link from "next/link";
import { StatusBadge, TypeBadge } from "@/components/badges";

type WorkItem = {
  id: string;
  title: string;
  status: string;
  itemType: string;
};

type WorkConstellationProps = {
  initiativeTitle: string;
  readyItems: WorkItem[];
  shippedItems: WorkItem[];
  blockedItems: WorkItem[];
  otherItems: WorkItem[];
};

function ConstellationNode({
  item,
  variant,
}: {
  item: WorkItem;
  variant: "ready" | "shipped" | "blocked" | "other";
}) {
  const colors = {
    ready: "border-orange-300 bg-orange-50 hover:border-orange-400",
    shipped: "border-emerald-300 bg-emerald-50 hover:border-emerald-400",
    blocked: "border-rose-300 bg-rose-50 hover:border-rose-400",
    other: "border-zinc-200 bg-white hover:border-zinc-300",
  };

  return (
    <Link
      href={`/queue/${item.id}`}
      className={`block rounded-lg border px-3 py-2 transition ${colors[variant]}`}
    >
      <p className="text-sm font-medium text-zinc-900">{item.title}</p>
      <div className="mt-1 flex gap-1.5">
        <TypeBadge type={item.itemType as "feature"} />
        <StatusBadge status={item.status as "captured"} />
      </div>
    </Link>
  );
}

function WorkGroup({
  label,
  items,
  variant,
}: {
  label: string;
  items: WorkItem[];
  variant: "ready" | "shipped" | "blocked" | "other";
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label} ({items.length})
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <ConstellationNode key={item.id} item={item} variant={variant} />
        ))}
      </div>
    </div>
  );
}

export function WorkConstellation({
  initiativeTitle,
  readyItems,
  shippedItems,
  blockedItems,
  otherItems,
}: WorkConstellationProps) {
  const hasWork =
    readyItems.length +
      shippedItems.length +
      blockedItems.length +
      otherItems.length >
    0;

  if (!hasWork) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
        No linked work yet. Promote a cluster from Curation or link items via API.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <div className="rounded-xl border-2 border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 px-6 py-3 text-center shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600">
            Core Initiative
          </p>
          <p className="mt-1 text-base font-semibold text-orange-950">
            {initiativeTitle}
          </p>
        </div>
        <div className="h-6 w-px bg-zinc-300" />
      </div>

      <WorkGroup label="Connected work" items={otherItems} variant="other" />
      <WorkGroup label="Ready to build" items={readyItems} variant="ready" />
      <WorkGroup label="Shipped work" items={shippedItems} variant="shipped" />
      <WorkGroup label="Blocked work" items={blockedItems} variant="blocked" />
    </div>
  );
}
