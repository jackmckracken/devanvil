import type { PrismaClient } from "@/generated/prisma/client";
import { getPortfolioHealth, getScoredInitiatives } from "@/lib/initiatives/queries";

export type WeeklyReview = {
  periodLabel: string;
  newCaptures: number;
  itemsPromoted: number;
  itemsArchived: number;
  investmentsStarted: number;
  investmentsCompleted: number;
  portfolioHealth: Awaited<ReturnType<typeof getPortfolioHealth>>;
  biggestBlocker: string | null;
  suggestedFocus: string;
  reviewQuestions: string[];
};

const REVIEW_QUESTIONS = [
  "Is this investment still worth making?",
  "Has its priority changed?",
  "What has changed since last review?",
  "Should we pause?",
  "Should we increase investment?",
  "What is blocking progress?",
];

export async function getWeeklyReview(
  prisma: PrismaClient,
  projectSlug: string,
): Promise<WeeklyReview> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    health,
    scored,
    newCaptures,
    itemsPromoted,
    itemsArchived,
    investmentsStarted,
    investmentsCompleted,
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
      : "Review proposed investments and promote the strongest candidate.";

  const now = new Date();
  const periodLabel = `Week of ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return {
    periodLabel,
    newCaptures,
    itemsPromoted,
    itemsArchived,
    investmentsStarted,
    investmentsCompleted,
    portfolioHealth: health,
    biggestBlocker,
    suggestedFocus,
    reviewQuestions: REVIEW_QUESTIONS,
  };
}
