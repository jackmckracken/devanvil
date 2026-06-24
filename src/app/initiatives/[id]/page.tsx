import { notFound } from "next/navigation";
import { InitiativeDetail } from "@/components/initiative-detail";
import { prisma } from "@/lib/db";
import { isItemReady } from "@/lib/initiatives/ready-items";
import {
  computePriorityScore,
  extractBlockers,
  extractDependencies,
} from "@/lib/initiatives/scoring";

type RouteContext = { params: Promise<{ id: string }> };

export default async function InitiativePage({ params }: RouteContext) {
  const { id } = await params;

  const initiative = await prisma.initiative.findUnique({
    where: { id },
    include: {
      project: { select: { name: true, slug: true } },
      items: {
        include: {
          devItem: {
            select: {
              id: true,
              title: true,
              status: true,
              itemType: true,
              priority: true,
              normalizedSummary: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!initiative) {
    notFound();
  }

  const items = initiative.items.map((i) => i.devItem);
  const regressionCount = items.filter((i) => i.itemType === "regression").length;
  const duplicateCount = 0;

  const priorityScore = computePriorityScore({
    strategicValue: initiative.strategicValue,
    status: initiative.status,
    priority: initiative.priority,
    itemCount: items.length,
    duplicateCount,
    regressionCount,
    scoreOverride: initiative.scoreOverride,
  });

  const blockers = extractBlockers(
    items.map((i) => ({
      status: i.status as "captured",
      title: i.title,
      itemType: i.itemType as "feature",
    })),
  );
  const dependencies = extractDependencies(items);

  const readyItems = items.filter((i) =>
    isItemReady(i.status as "captured", i.priority as "unset"),
  );
  const shippedItems = items.filter((i) => i.status === "shipped");

  const itemCountsByStatus = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <InitiativeDetail
      initiative={{
        ...initiative,
        priorityScore,
        blockers,
        dependencies,
        readyItems,
        shippedItems,
        itemCountsByStatus,
      }}
    />
  );
}
