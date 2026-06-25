import { prisma } from "@/lib/db";
import { getPortfolioFocus } from "@/lib/initiatives/ready-items";

export type MomentumItem = {
  id: string;
  title: string;
  kind: "execution" | "investment";
  status: string;
  href: string;
  completed: boolean;
};

export type MomentumSnapshot = {
  execution: MomentumItem[];
  investments: MomentumItem[];
  completedThisWeek: number;
  investmentsCompletedThisWeek: number;
  message: string;
};

export async function getMomentumSnapshot(
  projectSlug: string,
): Promise<MomentumSnapshot> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [portfolioFocus, activeInvestments, recentShipped, recentCompletedInvestments] =
    await Promise.all([
      getPortfolioFocus(prisma, projectSlug),
      prisma.investment.findMany({
        where: {
          project: { slug: projectSlug },
          status: { in: ["captured", "scheduled", "in_progress"] },
        },
        orderBy: [{ status: "desc" }, { leverage: "desc" }],
        take: 6,
      }),
      prisma.devItem.count({
        where: {
          project: { slug: projectSlug },
          status: "shipped",
          updatedAt: { gte: weekAgo },
        },
      }),
      prisma.investment.count({
        where: {
          project: { slug: projectSlug },
          status: "completed",
          completedAt: { gte: weekAgo },
        },
      }),
    ]);

  const execution: MomentumItem[] = [];

  if (portfolioFocus.recommendedNextItem) {
    execution.push({
      id: portfolioFocus.recommendedNextItem.id,
      title: portfolioFocus.recommendedNextItem.title,
      kind: "execution",
      status: portfolioFocus.recommendedNextItem.status,
      href: `/queue/${portfolioFocus.recommendedNextItem.id}`,
      completed: false,
    });
  }

  for (const item of portfolioFocus.readyItems.slice(0, 3)) {
    if (execution.some((e) => e.id === item.id)) continue;
    execution.push({
      id: item.id,
      title: item.title,
      kind: "execution",
      status: item.status,
      href: `/queue/${item.id}`,
      completed: false,
    });
  }

  const investments: MomentumItem[] = activeInvestments.map((inv) => ({
    id: inv.id,
    title: inv.title,
    kind: "investment" as const,
    status: inv.status,
    href: `/investments/${inv.id}`,
    completed: false,
  }));

  const message = buildMomentumMessage(
    recentShipped,
    recentCompletedInvestments,
    execution.length,
    investments.length,
  );

  return {
    execution,
    investments,
    completedThisWeek: recentShipped,
    investmentsCompletedThisWeek: recentCompletedInvestments,
    message,
  };
}

function buildMomentumMessage(
  shipped: number,
  investmentsDone: number,
  executionCount: number,
  investmentCount: number,
): string {
  if (shipped > 0 && investmentsDone > 0) {
    return `${shipped} shipped, ${investmentsDone} investments completed this week. Execution and capability both growing.`;
  }
  if (investmentsDone >= 3 && shipped === 0) {
    return `${investmentsDone} investments completed this week. No features shipped, but capability is compounding.`;
  }
  if (shipped > 0) {
    return `${shipped} item${shipped !== 1 ? "s" : ""} shipped this week.`;
  }
  if (executionCount === 0 && investmentCount === 0) {
    return "Capture an idea or investment to build momentum.";
  }
  return "Shipping matters. Compounding matters.";
}
