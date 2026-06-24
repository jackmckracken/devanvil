import Link from "next/link";
import type { CurationState } from "@/generated/prisma/client";
import { AppHeader } from "@/components/app-header";
import { PromoteClusterButton } from "@/components/promote-cluster-button";
import { CURATION_STATE_LABELS } from "@/lib/types";
import { buildClusters } from "@/lib/curation/clusterer";
import { prisma } from "@/lib/db";

type SearchParams = Promise<{ project?: string }>;

function curationBadgeClass(state: CurationState): string {
  switch (state) {
    case "archive_junk":
      return "bg-zinc-200 text-zinc-700";
    case "duplicate":
      return "bg-amber-100 text-amber-800";
    case "merge_candidate":
      return "bg-yellow-100 text-yellow-800";
    case "canonical":
      return "bg-emerald-100 text-emerald-800";
    case "keep":
      return "bg-sky-100 text-sky-800";
    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

export default async function CurationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = await searchParams;
  const projectSlug = filters.project ?? "studioops";

  const [projects, project] = await Promise.all([
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findUnique({ where: { slug: projectSlug } }),
  ]);

  if (!project) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-zinc-600">Project not found: {projectSlug}</p>
        </main>
      </>
    );
  }

  const items = await prisma.devItem.findMany({
    where: { projectId: project.id },
    include: {
      canonicalItem: { select: { id: true, title: true } },
    },
    orderBy: [{ curationState: "asc" }, { qualityScore: "desc" }, { title: "asc" }],
  });

  const junk = items.filter((item) => item.curationState === "archive_junk");
  const duplicates = items.filter(
    (item) => item.curationState === "duplicate" || item.curationState === "merge_candidate",
  );
  const canonicals = items.filter((item) => item.curationState === "canonical");
  const unreviewed = items.filter((item) => item.curationState === "unreviewed");

  const duplicateGroups = canonicals.map((canonical) => ({
    canonical,
    members: duplicates.filter((item) => item.canonicalItemId === canonical.id),
  })).filter((group) => group.members.length > 0);

  const clusterMap = new Map<string, typeof items>();
  for (const item of items.filter(
    (i) => i.curationState === "keep" || i.curationState === "canonical",
  )) {
    const key = item.itemType;
    const group = clusterMap.get(key) ?? [];
    group.push(item);
    clusterMap.set(key, group);
  }

  const curationItems = items
    .filter((i) => i.curationState !== "archive_junk")
    .map((i) => ({
      id: i.id,
      title: i.title,
      rawText: i.rawText,
      normalizedSummary: i.normalizedSummary,
      itemType: i.itemType,
      status: i.status,
      externalKey: i.externalKey,
      curationState: i.curationState,
      qualityScore: i.qualityScore,
      importOnly: false,
    }));

  const semanticClusters = buildClusters(
    curationItems,
    duplicateGroups.map((g) => ({
      canonicalId: g.canonical.id,
      canonicalTitle: g.canonical.title,
      members: g.members.map((m) => ({
        id: m.id,
        title: m.title,
        similarity: 0.8,
        curationState: m.curationState as "duplicate" | "merge_candidate",
      })),
    })),
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">Curation Review</h1>
            <p className="mt-1 text-zinc-500">
              Review junk archives, duplicate groups, and curated backlog for {project.name}.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            Run{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs">
              npm run curate:items -- --project {projectSlug} --dry-run
            </code>{" "}
            then{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs">--apply</code>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/curation?project=${p.slug}`}
              className={`rounded-full px-3 py-1 text-sm ${
                p.slug === projectSlug
                  ? "bg-orange-600 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {p.name}
            </Link>
          ))}
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total", value: items.length },
            { label: "Junk archived", value: junk.length },
            { label: "Duplicate groups", value: duplicateGroups.length },
            { label: "Unreviewed", value: unreviewed.length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm text-zinc-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">{stat.value}</p>
            </div>
          ))}
        </section>

        {junk.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900">Junk Archived</h2>
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-zinc-600">Title</th>
                    <th className="px-4 py-2 text-left font-medium text-zinc-600">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {junk.slice(0, 50).map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2">
                        <Link href={`/queue/${item.id}`} className="hover:text-orange-700">
                          {item.title}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-zinc-500">{item.curationReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {duplicateGroups.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900">Duplicate Groups</h2>
            <div className="space-y-4">
              {duplicateGroups.map((group) => (
                <div
                  key={group.canonical.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <p className="font-medium text-zinc-900">
                    Canonical:{" "}
                    <Link
                      href={`/queue/${group.canonical.id}`}
                      className="text-orange-700 hover:underline"
                    >
                      {group.canonical.title}
                    </Link>
                  </p>
                  <ul className="mt-2 space-y-1">
                    {group.members.map((member) => (
                      <li key={member.id} className="flex items-center gap-2 text-sm text-zinc-600">
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${curationBadgeClass(member.curationState)}`}
                        >
                          {CURATION_STATE_LABELS[member.curationState]}
                        </span>
                        <Link href={`/queue/${member.id}`} className="hover:text-orange-700">
                          {member.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-zinc-900">Semantic Clusters</h2>
          <p className="text-sm text-zinc-500">
            Curated clusters can be promoted to initiatives for prioritization.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {semanticClusters.map((cluster) => (
              <div
                key={cluster.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-zinc-900">{cluster.name}</h3>
                    <p className="text-xs text-zinc-500">{cluster.itemIds.length} items</p>
                  </div>
                  <PromoteClusterButton
                    projectSlug={projectSlug}
                    clusterName={cluster.name}
                    itemIds={cluster.itemIds}
                  />
                </div>
                <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-sm text-zinc-600">
                  {cluster.itemIds.slice(0, 10).map((itemId) => {
                    const item = items.find((i) => i.id === itemId);
                    if (!item) return null;
                    return (
                      <li key={itemId}>
                        <Link href={`/queue/${itemId}`} className="hover:text-orange-700">
                          {item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {semanticClusters.length === 0 && (
              <p className="text-sm text-zinc-500">No semantic clusters found for this project.</p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-zinc-900">Clusters by Type</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[...clusterMap.entries()].map(([itemType, groupItems]) => (
              <div
                key={itemType}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <h3 className="font-medium capitalize text-zinc-900">{itemType}</h3>
                <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm text-zinc-600">
                  {groupItems.slice(0, 20).map((item) => (
                    <li key={item.id}>
                      <Link href={`/queue/${item.id}`} className="hover:text-orange-700">
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
