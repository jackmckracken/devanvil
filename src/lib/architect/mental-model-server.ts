import { gatherArchitectEvidence } from "@/lib/architect/evidence";
import { normalizeMentalModel } from "@/lib/architect/mental-model";
import type { ArchitectMentalModel } from "@/lib/architect/mental-model-types";
import {
  computeNodePressures,
  demoEvidenceForExchange,
  mergeEvidence,
} from "@/lib/architect/pressure";

/** Server-only — backfill pressures on persisted models saved before v3.1. */
export async function hydrateMentalModel(
  model: Partial<ArchitectMentalModel> | null | undefined,
  projectSlug: string,
  exchangeCount = 0,
): Promise<ArchitectMentalModel> {
  const normalized = normalizeMentalModel(model);
  if (normalized.pressures.length > 0) return normalized;

  const live = await gatherArchitectEvidence(projectSlug);
  const isCI = normalized.nodes.some((n) => n.label === "Creative Investments");
  const evidence = isCI
    ? mergeEvidence(live, demoEvidenceForExchange(exchangeCount))
    : live;

  normalized.pressures = computeNodePressures(normalized.nodes, evidence, {
    momentumLinked: normalized.nodes.some(
      (n) => n.label === "Momentum" && n.state === "locked",
    ),
    practiceBoundaryLocked: normalized.nodes.some(
      (n) => n.label === "Practice" && n.state === "locked",
    ),
  });

  return normalized;
}
