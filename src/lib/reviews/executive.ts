import type { PrismaClient } from "@/generated/prisma/client";
import { getPortfolioHealth, getScoredInitiatives } from "@/lib/initiatives/queries";

export type ExecutiveReviewSummary = {
  periodLabel: string;
  newCaptures: number;
  itemsPromoted: number;
  itemsArchived: number;
  investmentsStarted: number;
  investmentsCompleted: number;
  researchQuestionsAdvanced: number;
  thesesGainedConfidence: number;
  newResearchQuestions: number;
  portfolioHealth: Awaited<ReturnType<typeof getPortfolioHealth>>;
  biggestBlocker: string | null;
  suggestedFocus: string;
};

export const EXECUTIVE_REVIEW_QUESTIONS = [
  "Which Research Questions advanced?",
  "Which Theses gained confidence?",
  "Which Principles produced the most value?",
  "What surprised us?",
  "Which assumptions were disproven?",
  "Which investments no longer support our Theses?",
  "What new Research Questions emerged?",
] as const;

export async function computeExecutiveReview(
  prisma: PrismaClient,
  projectSlug: string,
): Promise<ExecutiveReviewSummary> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const project = await prisma.project.findUnique({ where: { slug: projectSlug } });

  const [
    health,
    scored,
    newCaptures,
    itemsPromoted,
    itemsArchived,
    investmentsStarted,
    investmentsCompleted,
    researchQuestionsAdvanced,
    thesesGainedConfidence,
    newResearchQuestions,
  ] = await Promise.all([
    getPortfolioHealth(prisma, projectSlug),
    getScoredInitiatives(prisma, projectSlug),
    prisma.devItem.count({
      where: {
        project: { slug: projectSlug },
        createdAt: { gte: weekAgo },
        itemType: { not: "regression" },
      },
    }),
    prisma.initiative.count({
      where: {
        project: { slug: projectSlug },
        status: { in: ["active", "next"] },
        updatedAt: { gte: weekAgo },
      },
    }),
    prisma.devItem.count({
      where: {
        project: { slug: projectSlug },
        status: "archived",
        updatedAt: { gte: weekAgo },
      },
    }),
    prisma.initiative.count({
      where: {
        project: { slug: projectSlug },
        status: "active",
        updatedAt: { gte: weekAgo },
      },
    }),
    prisma.initiative.count({
      where: {
        project: { slug: projectSlug },
        status: "completed",
        updatedAt: { gte: weekAgo },
      },
    }),
    prisma.researchQuestion.count({
      where: {
        status: { in: ["converging", "answered"] },
        updatedAt: { gte: weekAgo },
      },
    }),
    prisma.confidenceSnapshot.count({
      where: { createdAt: { gte: weekAgo } },
    }),
    prisma.researchQuestion.count({
      where: { createdAt: { gte: weekAgo } },
    }),
  ]);

  const activeWithBlockers = scored.filter(
    (i) => i.status === "active" && i.blockers.length > 0,
  );
  const biggestBlocker =
    activeWithBlockers[0]?.blockers[0] ??
    (health.regressionCount > 0
      ? `${health.regressionCount} open regression(s) across portfolio`
      : null);

  const topActive = scored.find((i) => i.status === "active");
  const suggestedFocus = topActive
    ? `Continue ${topActive.title} — highest-priority active investment.`
    : scored.find((i) => i.status === "next")
      ? `Activate ${scored.find((i) => i.status === "next")!.title} when capacity opens.`
      : "Review research questions and promote the strongest thesis into investment.";

  const now = new Date();
  const periodLabel = `Week of ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return {
    periodLabel,
    newCaptures,
    itemsPromoted,
    itemsArchived,
    investmentsStarted,
    investmentsCompleted,
    researchQuestionsAdvanced,
    thesesGainedConfidence,
    newResearchQuestions,
    portfolioHealth: health,
    biggestBlocker,
    suggestedFocus,
  };
}

export async function persistExecutiveReview(
  prisma: PrismaClient,
  projectSlug: string,
  notes?: string,
) {
  const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 7);

  const summary = await computeExecutiveReview(prisma, projectSlug);

  return prisma.executiveReview.create({
    data: {
      projectId: project?.id,
      periodStart,
      periodEnd,
      summaryJson: summary,
      notes,
    },
  });
}

export async function getReviewHistory(
  prisma: PrismaClient,
  projectSlug?: string,
  limit = 12,
) {
  return prisma.executiveReview.findMany({
    where: projectSlug
      ? { project: { slug: projectSlug } }
      : undefined,
    orderBy: { periodEnd: "desc" },
    take: limit,
    include: { project: { select: { name: true, slug: true } } },
  });
}
