import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { InvestmentList } from "@/components/initiatives/investment-card";
import { RecommendedNextItemPanel } from "@/components/recommended-next-item";
import { prisma } from "@/lib/db";
import { getPortfolioFocus } from "@/lib/initiatives/ready-items";
import { getPortfolioHealth, getScoredInitiatives } from "@/lib/initiatives/queries";
import { groupPortfolio } from "@/lib/initiatives/portfolio";
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
        <main className="mx-auto max-w-3xl px-4 py-8">
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

  const [projects, health, scored, portfolioFocus] = await Promise.all([
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    getPortfolioHealth(prisma, projectSlug),
    getScoredInitiatives(prisma, projectSlug),
    getPortfolioFocus(prisma, projectSlug),
  ]);

  const portfolio = groupPortfolio(scored);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Engineering Portfolio
            </h1>
            <p className="mt-1 text-zinc-500">
              What deserves your attention today?
            </p>
          </div>
          <ProjectSwitcher projects={projects} current={projectSlug} basePath="/focus" />
        </div>

        {portfolioFocus.recommendedNextItem && (
          <RecommendedNextItemPanel
            item={portfolioFocus.recommendedNextItem}
            recommendedAction={portfolioFocus.recommendedAction}
          />
        )}

        {health.warnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
            <p className="text-sm font-medium text-amber-900">Portfolio constraint</p>
            <ul className="mt-1 text-sm text-amber-800">
              {health.warnings.map((w) => (
                <li key={w}>· {w}</li>
              ))}
            </ul>
          </div>
        )}

        <PortfolioSection
          title="Current Investments"
          subtitle="Active engineering capital"
          investments={portfolio.current}
          emptyMessage="No active investments. Promote work from Future Investments."
        />

        <PortfolioSection
          title="Future Investments"
          subtitle="Queued and under consideration"
          investments={portfolio.future}
          emptyMessage="No future investments on the horizon."
        />

        {portfolio.paused.length > 0 && (
          <PortfolioSection
            title="Paused Investments"
            subtitle="Deliberately on hold"
            investments={portfolio.paused}
            emptyMessage=""
          />
        )}

        {portfolio.completed.length > 0 && (
          <PortfolioSection
            title="Completed Investments"
            subtitle="Realized returns"
            investments={portfolio.completed.slice(0, 4)}
            emptyMessage=""
            footer={
              portfolio.completed.length > 4 ? (
                <p className="mt-2 text-xs text-zinc-400">
                  +{portfolio.completed.length - 4} more completed
                </p>
              ) : undefined
            }
          />
        )}

        <div className="flex gap-4 border-t border-zinc-200 pt-6 text-sm">
          <Link
            href={`/reviews?project=${projectSlug}`}
            className="text-orange-600 hover:underline"
          >
            Weekly Review →
          </Link>
          <Link
            href={`/backlog?project=${projectSlug}`}
            className="text-zinc-500 hover:text-zinc-700"
          >
            Backlog
          </Link>
        </div>
      </main>
    </>
  );
}

function PortfolioSection({
  title,
  subtitle,
  investments,
  emptyMessage,
  footer,
}: {
  title: string;
  subtitle: string;
  investments: ReturnType<typeof groupPortfolio>["current"];
  emptyMessage: string;
  footer?: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        <p className="text-sm text-zinc-500">{subtitle}</p>
      </div>
      <InvestmentList investments={investments} emptyMessage={emptyMessage} />
      {footer}
    </section>
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
