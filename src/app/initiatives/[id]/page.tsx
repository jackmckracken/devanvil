import { notFound } from "next/navigation";
import { InitiativeDetail } from "@/components/initiative-detail";
import { mentalModelToSnapshot } from "@/components/initiatives/mental-model-snapshot";
import type { ArchitectAnalysis } from "@/lib/architect/types";
import { prisma } from "@/lib/db";
import { buildBriefing } from "@/lib/initiatives/briefing";
import { computeInvestmentHealth } from "@/lib/initiatives/investment-health";
import { isItemReady } from "@/lib/initiatives/ready-items";
import {
  computePriorityScore,
  extractBlockers,
  extractDependencies,
} from "@/lib/initiatives/scoring";

type RouteContext = { params: Promise<{ id: string }> };

export default async function InitiativePage({ params }: RouteContext) {
  const { id } = await params;

  const initiative = await prisma.initiative.findUnique({
    where: { id },
    include: {
      project: { select: { name: true, slug: true } },
      architectSession: { select: { id: true, analysisJson: true } },
      thesis: {
        select: {
          id: true,
          statement: true,
          researchQuestion: { select: { question: true } },
        },
      },
      items: {
        include: {
          devItem: {
            select: {
              id: true,
              title: true,
              status: true,
              itemType: true,
              priority: true,
              normalizedSummary: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!initiative) {
    notFound();
  }

  const items = initiative.items.map((i) => i.devItem);
  const regressionCount = items.filter((i) => i.itemType === "regression").length;

  const priorityScore = computePriorityScore({
    strategicValue: initiative.strategicValue,
    status: initiative.status,
    priority: initiative.priority,
    itemCount: items.length,
    duplicateCount: 0,
    regressionCount,
    scoreOverride: initiative.scoreOverride,
  });

  const blockers = extractBlockers(
    items.map((i) => ({
      status: i.status as "captured",
      title: i.title,
      itemType: i.itemType as "feature",
    })),
  );
  const dependencies = extractDependencies(items);

  const readyItems = items.filter((i) =>
    isItemReady(i.status as "captured", i.priority as "unset"),
  );
  const shippedItems = items.filter((i) => i.status === "shipped");
  const blockedItems = items.filter(
    (i) =>
      i.status !== "shipped" &&
      !isItemReady(i.status as "captured", i.priority as "unset") &&
      (i.itemType === "regression" || i.itemType === "question"),
  );
  const categorized = new Set([
    ...readyItems,
    ...shippedItems,
    ...blockedItems,
  ].map((i) => i.id));
  const otherItems = items.filter((i) => !categorized.has(i.id));

  const briefing = buildBriefing(
    initiative.title,
    initiative.description,
    initiative.strategicValue,
    initiative.thesis?.statement,
  );

  let mentalModelSnapshot = null;
  let mentalModelConfidence: number | undefined;
  if (initiative.architectSession?.analysisJson) {
    const analysis = initiative.architectSession.analysisJson as ArchitectAnalysis;
    if (analysis.mentalModel) {
      mentalModelSnapshot = mentalModelToSnapshot(analysis.mentalModel);
      mentalModelConfidence = mentalModelSnapshot.confidence;
    }
  }

  const scoredInitiative = {
    id: initiative.id,
    title: initiative.title,
    description: initiative.description,
    status: initiative.status,
    priority: initiative.priority,
    strategicValue: initiative.strategicValue,
    targetRelease: initiative.targetRelease,
    scoreOverride: initiative.scoreOverride,
    priorityScore,
    itemCount: items.length,
    regressionCount,
    duplicateCount: 0,
    inBuildCount: items.filter((i) => i.status === "in_build").length,
    blockers,
    dependencies,
  };

  const health = computeInvestmentHealth(
    scoredInitiative,
    shippedItems.length,
    blockedItems.length,
    mentalModelConfidence,
  );

  return (
    <InitiativeDetail
      initiative={{
        id: initiative.id,
        title: initiative.title,
        description: initiative.description,
        status: initiative.status,
        priority: initiative.priority,
        strategicValue: initiative.strategicValue,
        targetRelease: initiative.targetRelease,
        scoreOverride: initiative.scoreOverride,
        project: initiative.project,
        briefing,
        health,
        mentalModelSnapshot,
        architectSessionId: initiative.architectSession?.id ?? null,
        readyItems,
        shippedItems,
        blockedItems,
        otherItems,
        blockers,
        dependencies,
        thesis: initiative.thesis
          ? {
              id: initiative.thesis.id,
              statement: initiative.thesis.statement,
              researchQuestion: initiative.thesis.researchQuestion.question,
            }
          : null,
      }}
    />
  );
}
