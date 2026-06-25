import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { ConversationalInput } from "@/components/workspace/conversational-input";
import { WorkspaceSections } from "@/components/workspace/workspace-sections";
import { prisma } from "@/lib/db";
import { getPortfolioFocus } from "@/lib/initiatives/ready-items";
import { getRecentIntakes, getRecentInvestigations } from "@/lib/workflow/memory";
import { MomentumPanel } from "@/components/investments/momentum-panel";
import { getMomentumSnapshot } from "@/lib/investments/momentum";
import { seedStudioOpsInvestments } from "@/lib/investments/seed";
import { seedProtectedDomains } from "@/lib/protected-domains/seed";

type SearchParams = Promise<{ project?: string }>;

export default async function WorkspacePage({
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
        <main className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-zinc-600">Project not found: {projectSlug}</p>
        </main>
      </>
    );
  }

  const domainCount = await prisma.protectedDomain.count({
    where: { projectId: project.id },
  });
  if (domainCount === 0 && projectSlug === "studioops") {
    await seedProtectedDomains(prisma, projectSlug);
  }

  const investmentCount = await prisma.investment.count({
    where: { projectId: project.id },
  });
  if (investmentCount === 0 && projectSlug === "studioops") {
    await seedStudioOpsInvestments(prisma, projectSlug);
  }

  const [projects, recentIntakes, portfolioFocus, recentInvestigations, finalDomainCount, momentum] =
    await Promise.all([
      prisma.project.findMany({ orderBy: { name: "asc" } }),
      getRecentIntakes(projectSlug, 6),
      getPortfolioFocus(prisma, projectSlug),
      getRecentInvestigations(projectSlug, 4),
      prisma.protectedDomain.count({ where: { projectId: project.id } }),
      getMomentumSnapshot(projectSlug),
    ]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl space-y-10 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">
              What are we building today?
            </h1>
            <p className="mt-1 text-zinc-500">
              Start with an idea. DevAnvil thinks architecturally before creating work items.
            </p>
          </div>
          <ProjectSwitcher projects={projects} current={projectSlug} />
        </div>

        <ConversationalInput projectSlug={projectSlug} />

        <MomentumPanel momentum={momentum} projectSlug={projectSlug} />

        <WorkspaceSections
          projectSlug={projectSlug}
          recentIntakes={recentIntakes}
          readyItems={portfolioFocus.readyItems}
          recentInvestigations={recentInvestigations}
          domainCount={finalDomainCount}
        />
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
          href={`/workspace?project=${p.slug}`}
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
