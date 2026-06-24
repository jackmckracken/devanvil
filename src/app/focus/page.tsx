import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { InitiativeList } from "@/components/initiative-card";
import { PortfolioHealthPanel } from "@/components/portfolio-health";
import { RecommendedNextItemPanel } from "@/components/recommended-next-item";
import { prisma } from "@/lib/db";
import { getPortfolioFocus } from "@/lib/initiatives/ready-items";
import {
  answerWhatNext,
  getPortfolioHealth,
  getScoredInitiatives,
} from "@/lib/initiatives/queries";
import { seedStudioOpsInitiatives } from "@/lib/initiatives/seed-initiatives";

type SearchParams = Promise<{ project?: string }>;

export default async function FocusPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = await searchParams;
  const projectSlug = filters.project ?? "studioops";

  const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
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

  const initiativeCount = await prisma.initiative.count({
    where: { projectId: project.id },
  });

  if (initiativeCount === 0) {
    await seedStudioOpsInitiatives(prisma);
  }

  const [projects, health, scored, whatNext, portfolioFocus] = await Promise.all([
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    getPortfolioHealth(prisma, projectSlug),
    getScoredInitiatives(prisma, projectSlug),
    answerWhatNext(prisma, projectSlug),
    getPortfolioFocus(prisma, projectSlug),
  ]);

  const active = scored.filter((i) => i.status === "active");
  const nextUp = scored.filter((i) => i.status === "next");
  const parkingLot = scored.filter(
    (i) =>
      i.strategicValue === "future_vision" ||
      i.strategicValue === "research" ||
      i.strategicValue === "delight",
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">Focus</h1>
            <p className="mt-1 text-zinc-500">
              What matters now. Top priorities in under 30 seconds.
            </p>
          </div>
          <ProjectSwitcher projects={projects} current={projectSlug} basePath="/focus" />
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Portfolio Health
          </h2>
          <PortfolioHealthPanel health={health} />
        </section>

        {portfolioFocus.recommendedNextItem && (
          <RecommendedNextItemPanel
            item={portfolioFocus.recommendedNextItem}
            recommendedAction={portfolioFocus.recommendedAction}
          />
        )}

        {whatNext.topInitiatives.length > 0 && (
          <section className="rounded-xl border border-orange-200 bg-orange-50 p-5">
            <h2 className="text-lg font-semibold text-orange-900">
              What should I work on next?
            </h2>
            <ol className="mt-3 space-y-2">
              {whatNext.topInitiatives.map((initiative, i) => (
                <li key={initiative.id} className="flex items-start gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <Link
                      href={`/initiatives/${initiative.id}`}
                      className="font-medium text-orange-900 hover:underline"
                    >
                      {initiative.title}
                    </Link>
                    <p className="text-orange-800">{whatNext.whyTheyMatter[i]}</p>
                    {initiative.blockers.length > 0 && (
                      <p className="text-xs text-orange-700">
                        Blocker: {initiative.blockers[0]}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-xl font-semibold text-zinc-900">Active Now</h2>
          <InitiativeList
            initiatives={active}
            emptyMessage="No active initiatives. Promote work from Next Up or create a new initiative."
          />
        </section>

        {portfolioFocus.readyItems.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">Ready to Build</h2>
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <ul className="divide-y divide-zinc-100">
                {portfolioFocus.readyItems.slice(0, 8).map((item) => (
                  <li key={item.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          href={`/queue/${item.id}`}
                          className="text-sm font-medium text-zinc-900 hover:text-orange-600"
                        >
                          {item.title}
                        </Link>
                        {item.initiative && (
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {item.initiative.title} · score {item.score}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-zinc-400">
                          {item.rankingReasons.join(" · ")}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-orange-700">
                        {item.score}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900">Next Up</h2>
            <Link href={`/next?project=${projectSlug}`} className="text-sm text-orange-600 hover:underline">
              View all →
            </Link>
          </div>
          <InitiativeList
            initiatives={nextUp.slice(0, 4)}
            emptyMessage="Nothing queued as next. Review proposed initiatives."
          />
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-zinc-900">Parking Lot</h2>
          <InitiativeList
            initiatives={parkingLot.slice(0, 4)}
            emptyMessage="No future vision or research initiatives yet."
          />
        </section>
      </main>
    </>
  );
}

function ProjectSwitcher({
  projects,
  current,
  basePath,
}: {
  projects: { slug: string; name: string }[];
  current: string;
  basePath: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {projects.map((p) => (
        <Link
          key={p.slug}
          href={`${basePath}?project=${p.slug}`}
          className={`rounded-full px-3 py-1 text-sm ${
            p.slug === current
              ? "bg-orange-600 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          {p.name}
        </Link>
      ))}
    </div>
  );
}
