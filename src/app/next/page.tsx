import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { InitiativeList } from "@/components/initiative-card";
import { prisma } from "@/lib/db";
import { getScoredInitiatives } from "@/lib/initiatives/queries";

type SearchParams = Promise<{ project?: string }>;

export default async function NextPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = await searchParams;
  const projectSlug = filters.project ?? "studioops";

  const [projects, scored] = await Promise.all([
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    getScoredInitiatives(prisma, projectSlug),
  ]);

  const nextUp = scored.filter((i) => i.status === "next");
  const proposed = scored.filter((i) => i.status === "proposed");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">Next Up</h1>
            <p className="mt-1 text-zinc-500">
              Approved initiatives ready to become active when capacity opens.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {projects.map((p) => (
              <Link
                key={p.slug}
                href={`/next?project=${p.slug}`}
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

        <section>
          <h2 className="mb-3 text-xl font-semibold text-zinc-900">
            Next ({nextUp.length})
          </h2>
          <InitiativeList
            initiatives={nextUp}
            emptyMessage="No initiatives marked as next. Set status to 'next' on proposed work."
          />
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-zinc-900">
            Proposed ({proposed.length})
          </h2>
          <InitiativeList
            initiatives={proposed}
            emptyMessage="No proposed initiatives. Promote clusters from Curation or create manually."
          />
        </section>

        <p className="text-sm text-zinc-500">
          <Link href={`/focus?project=${projectSlug}`} className="text-orange-600 hover:underline">
            ← Back to Focus
          </Link>
        </p>
      </main>
    </>
  );
}
