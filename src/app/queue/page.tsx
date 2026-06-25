import { Suspense } from "react";
import type { DevItemStatus, ItemType, Priority } from "@/generated/prisma/client";
import { AppHeader } from "@/components/app-header";
import { QueueFilters } from "@/components/queue-filters";
import { QueueTable } from "@/components/queue-table";
import { prisma } from "@/lib/db";

type SearchParams = Promise<{
  project?: string;
  itemType?: string;
  status?: string;
  priority?: string;
  search?: string;
}>;

export default async function QueuePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = await searchParams;

  const [projects, items] = await Promise.all([
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    prisma.devItem.findMany({
      where: {
        isCapture: false,
        ...(filters.project ? { project: { slug: filters.project } } : {}),
        ...(filters.itemType ? { itemType: filters.itemType as ItemType } : {}),
        ...(filters.status
          ? { status: filters.status as DevItemStatus }
          : { status: { notIn: ["archived", "rejected", "duplicate"] } }),
        ...(filters.priority ? { priority: filters.priority as Priority } : {}),
        ...(filters.search
          ? {
              OR: [
                { title: { contains: filters.search, mode: "insensitive" } },
                { rawText: { contains: filters.search, mode: "insensitive" } },
                {
                  normalizedSummary: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        project: { select: { name: true, slug: true } },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900">Development Queue</h1>
          <p className="mt-1 text-zinc-500">
            Review captured ideas, check duplicates, and move work toward execution.
          </p>
        </div>

        <Suspense fallback={<div className="h-24 rounded-xl bg-zinc-100" />}>
          <QueueFilters projects={projects} />
        </Suspense>

        <QueueTable items={items} />
      </main>
    </>
  );
}
