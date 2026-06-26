import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { ExecutiveReviewPanel } from "@/components/reviews/executive-review-panel";
import { prisma } from "@/lib/db";
import { getScoredInitiatives } from "@/lib/initiatives/queries";
import { seedStudioOpsInitiatives } from "@/lib/initiatives/seed-initiatives";
import { ensurePrinciplesSeeded } from "@/lib/principles/queries";
import {
  computeExecutiveReview,
  getReviewHistory,
} from "@/lib/reviews/executive";

type SearchParams = Promise<{ project?: string }>;

export default async function ReviewsPage({
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

  await ensurePrinciplesSeeded(prisma);

  const initiativeCount = await prisma.initiative.count({
    where: { projectId: project.id },
  });
  if (initiativeCount === 0) {
    await seedStudioOpsInitiatives(prisma);
  }

  const [projects, review, scored, history] = await Promise.all([
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    computeExecutiveReview(prisma, projectSlug),
    getScoredInitiatives(prisma, projectSlug),
    getReviewHistory(prisma, projectSlug),
  ]);

  const activeInvestments = scored
    .filter((i) => i.status === "active" || i.status === "next")
    .map((i) => ({ id: i.id, title: i.title, blockers: i.blockers }));

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Executive Review
            </h1>
            <p className="mt-1 text-zinc-500">{review.periodLabel}</p>
          </div>
          <ProjectSwitcher projects={projects} current={projectSlug} />
        </div>

        <ExecutiveReviewPanel
          review={review}
          projectSlug={projectSlug}
          history={history}
          activeInvestments={activeInvestments}
        />

        <Link
          href={`/focus?project=${projectSlug}`}
          className="text-sm text-orange-600 hover:underline"
        >
          ← Back to Engineering Portfolio
        </Link>
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
          href={`/reviews?project=${p.slug}`}
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
