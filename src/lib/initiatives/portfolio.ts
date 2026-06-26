import type { ScoredInitiative } from "@/lib/initiatives/types";
import { buildBriefing } from "@/lib/initiatives/briefing";
import { computeInvestmentHealth } from "@/lib/initiatives/investment-health";

export type PortfolioInvestment = {
  initiative: ScoredInitiative;
  thesis: string;
  health: ReturnType<typeof computeInvestmentHealth>;
};

export type EngineeringPortfolio = {
  current: PortfolioInvestment[];
  future: PortfolioInvestment[];
  paused: PortfolioInvestment[];
  completed: PortfolioInvestment[];
};

function toPortfolioInvestment(
  initiative: ScoredInitiative,
  shippedCount = 0,
  blockedCount = 0,
): PortfolioInvestment {
  return {
    initiative,
    thesis: buildBriefing(
      initiative.title,
      initiative.description,
      initiative.strategicValue,
    ).thesis,
    health: computeInvestmentHealth(
      initiative,
      shippedCount,
      blockedCount,
    ),
  };
}

export function groupPortfolio(
  scored: ScoredInitiative[],
): EngineeringPortfolio {
  const current = scored
    .filter((i) => i.status === "active" || i.status === "next")
    .map((i) => toPortfolioInvestment(i));

  const future = scored
    .filter(
      (i) =>
        i.status === "proposed" ||
        i.strategicValue === "future_vision" ||
        i.strategicValue === "research",
    )
    .filter((i) => i.status !== "active" && i.status !== "next")
    .map((i) => toPortfolioInvestment(i));

  const paused = scored
    .filter((i) => i.status === "paused")
    .map((i) => toPortfolioInvestment(i));

  const completed = scored
    .filter((i) => i.status === "completed")
    .map((i) => toPortfolioInvestment(i));

  return { current, future, paused, completed };
}
