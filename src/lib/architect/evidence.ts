import { prisma } from "@/lib/db";
import {
  EMPTY_FAMILIES,
  inferFamilyFromInvestment,
  type ArchitectEvidence,
} from "@/lib/architect/evidence-types";

export type { ArchitectEvidence, CapabilityFamily } from "@/lib/architect/evidence-types";
export {
  EMPTY_FAMILIES,
  familyEvidenceRows,
  mapCategoryToFamily,
} from "@/lib/architect/evidence-types";

export async function gatherArchitectEvidence(projectSlug: string): Promise<ArchitectEvidence> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });

  if (!project) {
    return {
      completedInvestments: 0,
      totalInvestments: 0,
      capabilityFamilies: { ...EMPTY_FAMILIES },
      completedWorkItems: 0,
      captures: 0,
      architectDiscussions: 0,
      featureRequests: 0,
      regressions: 0,
    };
  }

  const [
    investments,
    completedWorkItems,
    captures,
    architectDiscussions,
    featureRequests,
    regressions,
  ] = await Promise.all([
    prisma.investment.findMany({
      where: { projectId: project.id },
      select: { category: true, status: true, title: true, capabilityTarget: true },
    }),
    prisma.devItem.count({
      where: {
        projectId: project.id,
        status: "shipped",
        isCapture: false,
      },
    }),
    prisma.devItem.count({
      where: { projectId: project.id, isCapture: true, status: { not: "archived" } },
    }),
    prisma.architectSession.count({
      where: { projectId: project.id, status: { not: "discarded" } },
    }),
    prisma.devItem.count({
      where: {
        projectId: project.id,
        itemType: "feature",
        isCapture: false,
        status: { notIn: ["archived", "rejected"] },
      },
    }),
    prisma.devItem.count({
      where: {
        projectId: project.id,
        itemType: "bug",
        isCapture: false,
        status: { notIn: ["archived", "rejected"] },
      },
    }),
  ]);

  const capabilityFamilies = { ...EMPTY_FAMILIES };
  let completedInvestments = 0;

  for (const inv of investments) {
    if (inv.status !== "completed") continue;
    completedInvestments += 1;
    const family = inferFamilyFromInvestment(inv.category, inv.title, inv.capabilityTarget);
    capabilityFamilies[family] += 1;
  }

  return {
    completedInvestments,
    totalInvestments: investments.length,
    capabilityFamilies,
    completedWorkItems,
    captures,
    architectDiscussions,
    featureRequests,
    regressions,
  };
}
