import { prisma } from "@/lib/db";
import { findMatches } from "@/lib/duplicate-detection";
import { detectProtectedDomains } from "@/lib/protected-domains/detection";
import { getProtectedDomainChecklist } from "@/lib/protected-domains/detection";
import {
  buildArchitecturalBrief,
  buildProtectionSummary,
  classifyChange,
  suggestInitiative,
  suggestWorkItems,
} from "@/lib/workflow/brief";
import { classifyInvestment } from "@/lib/investments/classify";
import { getCategoryMeta, LEVERAGE_LABELS } from "@/lib/investments/categories";
import { createInvestmentFromClassification } from "@/lib/investments/queries";
import { deriveArchitecturalSummary } from "@/lib/workflow/intent";
import { searchArchitecturalMemory } from "@/lib/workflow/memory";
import { parseWorkflowInput } from "@/lib/workflow/parse-input";
import type {
  ArchitecturalIntakeResult,
  ChangeCategory,
  SuggestedInitiative,
  WorkflowProcessInput,
  WorkflowProcessOutput,
} from "@/lib/workflow/types";
import type { ItemType, WorkflowCommand } from "@/generated/prisma/client";

async function findRelatedInitiatives(
  query: string,
  projectSlug: string,
): Promise<SuggestedInitiative[]> {
  const initiatives = await prisma.initiative.findMany({
    where: {
      project: { slug: projectSlug },
      status: { notIn: ["archived", "completed"] },
    },
    include: {
      items: {
        include: {
          devItem: { select: { title: true, normalizedSummary: true } },
        },
      },
    },
    take: 30,
  });

  const queryLower = query.toLowerCase();
  const queryTokens = queryLower.split(/\s+/).filter((t) => t.length > 3);

  const scored = initiatives
    .map((init) => {
      const corpus = [
        init.title,
        init.description ?? "",
        ...init.items.flatMap((i) => [
          i.devItem.title,
          i.devItem.normalizedSummary,
        ]),
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      for (const token of queryTokens) {
        if (corpus.includes(token)) score += 1;
      }
      if (corpus.includes(queryLower.slice(0, 20))) score += 2;

      return {
        id: init.id,
        title: init.title,
        rationale:
          score > 0
            ? `Keyword overlap with initiative scope (${score} signals).`
            : "Related by project context.",
        isNew: false,
        score,
      };
    })
    .filter((i) => i.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return scored.map(({ score: _, ...rest }) => rest);
}

function buildInvestigation(intent: string, domains: string[]) {
  const title = intent.length > 80 ? `${intent.slice(0, 77)}...` : intent;
  return {
    title,
    hypotheses: [
      "Timing or race condition in affected subsystem",
      "State not properly initialized on mount or navigation",
      "Regression from recent change in a protected domain",
      "Inconsistent prompt or context assembly upstream",
    ],
    suggestedSteps: [
      "Reproduce with minimal steps and capture environment",
      "Check recent domain changes and open violations",
      "Review related architectural memory and prior investigations",
      "Inspect logs, network, and runtime inventory if applicable",
      "Do not implement until root cause is identified",
    ],
    affectedDomains: domains,
  };
}

async function buildShipReport(text: string, projectSlug: string) {
  const devItemIdMatch = text.match(/dev-([a-z0-9]+)/i);
  let item = null;

  if (devItemIdMatch) {
    const partialId = devItemIdMatch[1];
    item = await prisma.devItem.findFirst({
      where: {
        project: { slug: projectSlug },
        OR: [
          { id: { startsWith: partialId } },
          { title: { contains: partialId, mode: "insensitive" } },
        ],
      },
      include: { builds: true },
    });
  } else {
    item = await prisma.devItem.findFirst({
      where: {
        project: { slug: projectSlug },
        status: "in_build",
      },
      orderBy: { updatedAt: "desc" },
      include: { builds: true },
    });
  }

  const detection = await detectProtectedDomains({ text, projectSlug });
  const gates: ArchitecturalIntakeResult["shipReport"] = {
    gates: [],
    protectedDomainsChecked: detection.map((d) => d.domain.name),
    evidenceRequired: [
      "Playwright or E2E run",
      "Contract impact report",
      "Golden master comparison (if visual)",
    ],
    readyToShip: false,
    blockers: [],
  };

  for (const d of detection) {
    const checklist = await getProtectedDomainChecklist(d.domain.slug);
    if (checklist) {
      for (const gate of checklist.gates) {
        gates.gates.push({
          name: `${d.domain.name}: ${gate.name}`,
          passed: gate.passed,
          required: gate.required,
        });
      }
      if (!checklist.canMarkComplete) {
        gates.blockers.push(
          `${d.domain.name}: required gates not satisfied or open violations`,
        );
      }
    }
  }

  if (!item) {
    gates.blockers.push("No in-build work item found to ship");
  } else if (item.status !== "in_build" && item.status !== "approved") {
    gates.blockers.push(`Work item "${item.title}" is ${item.status}, not ready to ship`);
  }

  if (item && item.builds.length === 0) {
    gates.blockers.push("No linked branch or build evidence");
  }

  const requiredGates = gates.gates.filter((g) => g.required);
  const allRequiredPassed =
    requiredGates.length === 0 || requiredGates.every((g) => g.passed);

  gates.readyToShip =
    gates.blockers.length === 0 && allRequiredPassed && item !== null;

  return { shipReport: gates, itemTitle: item?.title ?? null };
}

async function processInvestment(
  body: string,
  projectSlug: string,
): Promise<ArchitecturalIntakeResult> {
  const classification = classifyInvestment(body);
  const [memory, relatedInitiatives] = await Promise.all([
    searchArchitecturalMemory(body, projectSlug, 6),
    findRelatedInitiatives(body, projectSlug),
  ]);

  const categoryMeta = getCategoryMeta(classification.category);

  return {
    command: "investment",
    intent: classification.capabilityTarget,
    domains: [],
    memory,
    relatedInitiatives,
    relatedWorkItems: [],
    suggestedInitiative: null,
    suggestedWorkItems: [],
    changeCategory: null,
    recommendedNextStep:
      "Accept to capture this investment. Schedule time, complete it, then reflect on capability gained.",
    protectionSummary: {
      highestLevel: null,
      requiredContracts: [],
      requiredEvidence: ["Notes", "Documentation", "Research findings"],
      requiredTests: [],
    },
    investment: {
      classification,
      categoryLabel: categoryMeta.label,
      leverageLabel: LEVERAGE_LABELS[classification.leverage],
      relatedInitiatives,
    },
  };
}

async function processCommand(
  command: WorkflowCommand,
  body: string,
  projectSlug: string,
): Promise<ArchitecturalIntakeResult> {
  const { intent, title, summary } = deriveArchitecturalSummary(body);
  const domains = await detectProtectedDomains({ text: body, projectSlug });
  const hasProtected = domains.some(
    (d) =>
      d.domain.protectionLevel === "protected" ||
      d.domain.protectionLevel === "locked",
  );

  const [memory, relatedInitiatives, { related: relatedWorkItems }] =
    await Promise.all([
      searchArchitecturalMemory(body, projectSlug, 8),
      findRelatedInitiatives(body, projectSlug),
      findMatches(title, summary),
    ]);

  const protectionSummary = buildProtectionSummary(domains);
  let changeCategory: ChangeCategory | null = null;
  let investigation: ArchitecturalIntakeResult["investigation"];
  let shipReport: ArchitecturalIntakeResult["shipReport"];
  let recommendedNextStep: string;

  if (command === "change_classify") {
    changeCategory = classifyChange(body, hasProtected);
    recommendedNextStep =
      changeCategory === "Polish" || changeCategory === "Bug Fix"
        ? "Accept to create a scoped work item, or proceed directly to /forge_plan if already approved."
        : "Review protection requirements, then accept to create work items.";
  } else if (command === "investigate") {
    investigation = buildInvestigation(
      intent,
      domains.map((d) => d.domain.name),
    );
    recommendedNextStep =
      "Investigation recorded. Gather evidence before creating implementation work items.";
  } else if (command === "ship") {
    const ship = await buildShipReport(body, projectSlug);
    shipReport = ship.shipReport;
    recommendedNextStep = shipReport.readyToShip
      ? "Run /forge_ship in StudioOps and update item status via MCP."
      : "Resolve blockers and collect required evidence before shipping.";
  } else {
    changeCategory = classifyChange(body, hasProtected);
    recommendedNextStep = hasProtected
      ? "Review architectural brief and protected domain requirements. Accept to create work items and open Forge."
      : "Accept suggested work items to begin Forge planning.";
  }

  const suggestedWorkItems = suggestWorkItems(intent, title, summary, changeCategory);
  const suggestedInitiative = suggestInitiative(intent, title, relatedInitiatives);

  return {
    command,
    intent,
    domains,
    memory,
    relatedInitiatives,
    relatedWorkItems,
    suggestedInitiative,
    suggestedWorkItems,
    changeCategory,
    recommendedNextStep,
    protectionSummary,
    investigation,
    shipReport,
  };
}

export async function processWorkflow(
  input: WorkflowProcessInput,
): Promise<WorkflowProcessOutput> {
  const text = input.text?.trim();
  if (!text) throw new Error("text is required");

  const project = await prisma.project.findUnique({
    where: { slug: input.projectSlug },
  });
  if (!project) throw new Error(`Project not found: ${input.projectSlug}`);

  const parsed = input.command
    ? { command: input.command, body: text, wasExplicitCommand: true }
    : parseWorkflowInput(text);

  const body = parsed.body || text;
  const result =
    parsed.command === "investment"
      ? await processInvestment(body, input.projectSlug)
      : await processCommand(parsed.command, body, input.projectSlug);
  const briefMarkdown = buildArchitecturalBrief(result, body);

  const intake = await prisma.architecturalIntake.create({
    data: {
      projectId: project.id,
      command: parsed.command,
      rawInput: text,
      intent: result.intent,
      briefMarkdown,
      resultJson: result as object,
      status: "complete",
    },
  });

  return {
    intakeId: intake.id,
    result,
    briefMarkdown,
  };
}

export async function acceptIntake(
  intakeId: string,
  options?: { createWorkItems?: boolean; linkInitiativeId?: string },
): Promise<{ itemIds: string[]; initiativeId?: string; investmentId?: string }> {
  const intake = await prisma.architecturalIntake.findUnique({
    where: { id: intakeId },
    include: { project: true },
  });
  if (!intake) throw new Error("Intake not found");

  const result = intake.resultJson as ArchitecturalIntakeResult | null;
  if (!result) throw new Error("Intake has no result");

  if (intake.status === "accepted") {
    const existing = intake.acceptedItemIds as string[] | null;
    if (result.command === "investment" && existing?.[0]) {
      return { itemIds: [], investmentId: existing[0] };
    }
    return { itemIds: existing ?? [] };
  }

  if (result.command === "investment" && result.investment) {
    const investment = await createInvestmentFromClassification(
      intake.projectId,
      result.investment.classification,
      intake.rawInput,
      intake.id,
    );

    const initiativeId =
      options?.linkInitiativeId ??
      result.investment.relatedInitiatives.find((i) => i.id)?.id;

    if (initiativeId) {
      await prisma.initiativeInvestment.create({
        data: {
          initiativeId,
          investmentId: investment.id,
          recommended: false,
        },
      });
    }

    await prisma.architecturalIntake.update({
      where: { id: intakeId },
      data: {
        status: "accepted",
        acceptedItemIds: [investment.id],
      },
    });

    return { itemIds: [], investmentId: investment.id, initiativeId };
  }

  const itemIds: string[] = [];
  const createItems = options?.createWorkItems !== false;

  if (createItems && result.suggestedWorkItems.length > 0) {
    for (const suggested of result.suggestedWorkItems) {
      const item = await prisma.devItem.create({
        data: {
          projectId: intake.projectId,
          title: suggested.title,
          rawText: intake.rawInput,
          normalizedSummary: suggested.summary,
          sourceType: "manual",
          itemType: suggested.itemType as ItemType,
          status: "captured",
          artifacts: {
            create: {
              artifactType: "note",
              content: `Created from architectural intake ${intake.id}\n\n${suggested.rationale}`,
            },
          },
          activity: {
            create: {
              action: "captured",
              note: `Architectural intake accepted (${intake.command})`,
            },
          },
        },
      });
      itemIds.push(item.id);

      if (options?.linkInitiativeId) {
        await prisma.initiativeItem.create({
          data: {
            initiativeId: options.linkInitiativeId,
            devItemId: item.id,
          },
        });
      }
    }
  }

  let initiativeId = options?.linkInitiativeId;

  if (
    !initiativeId &&
    result.suggestedInitiative?.id &&
    !result.suggestedInitiative.isNew
  ) {
    initiativeId = result.suggestedInitiative.id;
    for (const itemId of itemIds) {
      await prisma.initiativeItem.upsert({
        where: {
          initiativeId_devItemId: {
            initiativeId,
            devItemId: itemId,
          },
        },
        create: { initiativeId, devItemId: itemId },
        update: {},
      });
    }
  }

  await prisma.architecturalIntake.update({
    where: { id: intakeId },
    data: {
      status: "accepted",
      acceptedItemIds: itemIds,
    },
  });

  return { itemIds, initiativeId };
}
