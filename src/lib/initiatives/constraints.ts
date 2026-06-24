import type { InitiativePriority, InitiativeStatus } from "@/generated/prisma/client";
import { PORTFOLIO_LIMITS } from "@/lib/initiatives/types";

type InitiativeForConstraints = {
  status: InitiativeStatus;
  priority: InitiativePriority;
  inBuildCount: number;
};

export function checkPortfolioConstraints(
  initiatives: InitiativeForConstraints[],
): string[] {
  const warnings: string[] = [];

  const activeCount = initiatives.filter((i) => i.status === "active").length;
  if (activeCount > PORTFOLIO_LIMITS.activeInitiatives) {
    warnings.push(
      `Active initiatives (${activeCount}) exceed limit of ${PORTFOLIO_LIMITS.activeInitiatives}`,
    );
  }

  const criticalCount = initiatives.filter(
    (i) =>
      i.priority === "critical" && (i.status === "active" || i.status === "next"),
  ).length;
  if (criticalCount > PORTFOLIO_LIMITS.criticalInitiatives) {
    warnings.push(
      `Critical initiatives (${criticalCount}) exceed limit of ${PORTFOLIO_LIMITS.criticalInitiatives}`,
    );
  }

  const inBuildCount = initiatives.filter((i) => i.inBuildCount > 0).length;
  if (inBuildCount > PORTFOLIO_LIMITS.inBuildInitiatives) {
    warnings.push(
      `In-build initiatives (${inBuildCount}) exceed limit of ${PORTFOLIO_LIMITS.inBuildInitiatives}`,
    );
  }

  return warnings;
}
