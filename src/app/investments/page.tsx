import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { InvestmentCard } from "@/components/investments/investment-card";
import { prisma } from "@/lib/db";
import {
  getRecentlyCompleted,
  getSuggestedNextInvestment,
  inferPotentialInvestments,
  listInvestments,
} from "@/lib/investments/queries";
import { seedStudioOpsInvestments } from "@/lib/investments/seed";
import { INVESTMENT_CATEGORIES } from "@/lib/investments/categories";

type SearchParams = Promise<{ project?: string; category?: string }>;

export default async function InvestmentsPage({
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
        <main className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-zinc-600">Project not found</p>
        </main>
      </>
    );
  }

  const count = await prisma.investment.count({ where: { projectId: project.id } });
  if (count === 0 && projectSlug === "studioops") {
    await seedStudioOpsInvestments(prisma, projectSlug);
  }

  const [projects, investments, suggested, recentlyCompleted, potential] = await Promise.all([
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    listInvestments(projectSlug),
    getSuggestedNextInvestment(projectSlug),
    getRecentlyCompleted(projectSlug, 4),
    inferPotentialInvestments(prisma, projectSlug),
  ]);

  const active = investments.filter((i) =>
    ["captured", "scheduled", "in_progress"].includes(i.status),
  );
  const completed = investments.filter((i) => i.status === "completed");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">Investments</h1>
            <p className="mt-1 text-zinc-500">
              Work that increases future leverage. Not features — capability.
            </p>
          </div>
          <ProjectSwitcher projects={projects} current={projectSlug} />
        </div>

        {suggested && (
          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
              Suggested Next Investment
            </h2>
            <Link
              href={`/investments/${suggested.id}`}
              className="mt-2 block text-lg font-medium text-emerald-900 hover:underline"
            >
              {suggested.title}
            </Link>
            <p className="mt-1 text-sm text-emerald-700">{suggested.capabilityTarget}</p>
          </section>
        )}

        <div className="flex flex-wrap gap-2">
          <FilterLink href={`/investments?project=${projectSlug}`} active={!filters.category}>
            All
          </FilterLink>
          {INVESTMENT_CATEGORIES.map((cat) => (
            <FilterLink
              key={cat.id}
              href={`/investments?project=${projectSlug}&category=${cat.id}`}
              active={filters.category === cat.id}
            >
              {cat.label}
            </FilterLink>
          ))}
        </div>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900">Portfolio</h2>
          {active.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No active investments. Capture one from the workspace: &ldquo;I&apos;d like to learn
              Komplete Kontrol.&rdquo;
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {active
                .filter((i) => !filters.category || i.category === filters.category)
                .map((inv) => (
                  <InvestmentCard key={inv.id} investment={inv} />
                ))}
            </div>
          )}
        </section>

        {potential.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-900">
              Inferred from Current Work
            </h2>
            <ul className="space-y-2">
              {potential.map((p) => (
                <li
                  key={p.title}
                  className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-3 text-sm"
                >
                  <span className="font-medium text-zinc-800">{p.title}</span>
                  <span className="ml-2 text-zinc-400">· {p.category}</span>
                  <p className="mt-1 text-zinc-500">{p.rationale}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {recentlyCompleted.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-900">
              Recently Completed — Capability Added
            </h2>
            <ul className="space-y-3">
              {recentlyCompleted.map((inv) => (
                <li key={inv.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                  <Link
                    href={`/investments/${inv.id}`}
                    className="font-medium text-zinc-900 hover:text-orange-600"
                  >
                    {inv.title}
                  </Link>
                  {inv.capabilityAdded && (
                    <p className="mt-1 text-sm text-emerald-700">
                      ✓ {inv.capabilityAdded}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-400">Archived Capability</h2>
            <div className="grid gap-3 md:grid-cols-2 opacity-75">
              {completed.map((inv) => (
                <InvestmentCard key={inv.id} investment={inv} compact />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

function ProjectSwitcher({
  projects,
  current,
}: {
  projects: { slug: string; name: string }[];
  current: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {projects.map((p) => (
        <Link
          key={p.slug}
          href={`/investments?project=${p.slug}`}
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

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-xs ${
        active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
      }`}
    >
      {children}
    </Link>
  );
}
