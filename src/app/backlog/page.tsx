import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { InitiativeList } from "@/components/initiative-card";
import { StatusBadge, TypeBadge } from "@/components/badges";
import { prisma } from "@/lib/db";
import {
  answerBlockingLaunch,
  answerWhatCanWait,
  getScoredInitiatives,
} from "@/lib/initiatives/queries";

type SearchParams = Promise<{ project?: string }>;

export default async function BacklogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = await searchParams;
  const projectSlug = filters.project ?? "studioops";

  const [projects, scored, blocking, canWait, unassignedItems] = await Promise.all([
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    getScoredInitiatives(prisma, projectSlug),
    answerBlockingLaunch(prisma, projectSlug),
    answerWhatCanWait(prisma, projectSlug),
    prisma.devItem.findMany({
      where: {
        project: { slug: projectSlug },
        status: { notIn: ["archived", "rejected", "duplicate", "shipped"] },
        initiativeItems: { none: {} },
      },
      include: { project: { select: { slug: true } } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 50,
    }),
  ]);

  const paused = scored.filter((i) => i.status === "paused");
  const completed = scored.filter((i) => i.status === "completed");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">Backlog</h1>
            <p className="mt-1 text-zinc-500">
              Everything not in active focus. Assign items to initiatives to reduce noise.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {projects.map((p) => (
              <Link
                key={p.slug}
                href={`/backlog?project=${p.slug}`}
                className={`rounded-full px-3 py-1 text-sm ${
                  p.slug === projectSlug
                    ? "bg-orange-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {p.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-rose-200 bg-rose-50 p-5">
            <h2 className="text-lg font-semibold text-rose-900">What is blocking launch?</h2>
            <div className="mt-3 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-rose-800">Beta Critical</h3>
                {blocking.betaCritical.length === 0 ? (
                  <p className="text-sm text-rose-700">None</p>
                ) : (
                  <ul className="mt-1 list-inside list-disc text-sm text-rose-800">
                    {blocking.betaCritical.map((i) => (
                      <li key={i.id}>
                        <Link href={`/initiatives/${i.id}`} className="hover:underline">
                          {i.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-rose-800">Launch Critical</h3>
                {blocking.launchCritical.length === 0 ? (
                  <p className="text-sm text-rose-700">None</p>
                ) : (
                  <ul className="mt-1 list-inside list-disc text-sm text-rose-800">
                    {blocking.launchCritical.map((i) => (
                      <li key={i.id}>
                        <Link href={`/initiatives/${i.id}`} className="hover:underline">
                          {i.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-violet-200 bg-violet-50 p-5">
            <h2 className="text-lg font-semibold text-violet-900">What can wait?</h2>
            {canWait.length === 0 ? (
              <p className="mt-2 text-sm text-violet-700">No deferred initiatives.</p>
            ) : (
              <ul className="mt-3 list-inside list-disc text-sm text-violet-800">
                {canWait.map((i) => (
                  <li key={i.id}>
                    <Link href={`/initiatives/${i.id}`} className="hover:underline">
                      {i.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-zinc-900">
            Unassigned Items ({unassignedItems.length})
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-zinc-100">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {unassignedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/queue/${item.id}`}
                        className="text-sm font-medium text-zinc-900 hover:text-orange-600"
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={item.itemType} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {unassignedItems.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-zinc-500">
                All items are assigned to initiatives.
              </p>
            )}
          </div>
        </section>

        {paused.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">Paused</h2>
            <InitiativeList initiatives={paused} emptyMessage="" />
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">Completed</h2>
            <InitiativeList initiatives={completed} emptyMessage="" />
          </section>
        )}

        <p className="text-sm text-zinc-500">
          <Link href={`/focus?project=${projectSlug}`} className="text-orange-600 hover:underline">
            ← Back to Focus
          </Link>
        </p>
      </main>
    </>
  );
}
