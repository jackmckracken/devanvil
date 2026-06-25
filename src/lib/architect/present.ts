import type {
  ArchitectMentalModel,
  ArchitecturalPressure,
  ModelChange,
  ModelChangeType,
  ModelNode,
  ModelRelationship,
  PressureRecommendation,
} from "@/lib/architect/mental-model-types";

const UNSETTLED_CONFIDENCE = 75;

export function isNodeSettled(node: ModelNode): boolean {
  if (node.state === "locked") return true;
  if (node.state === "proposed" || node.state === "uncertain") return false;
  if (node.assumptions.some((a) => a.status === "open")) return false;
  return node.confidence >= UNSETTLED_CONFIDENCE;
}

export function isNodeFocus(node: ModelNode): boolean {
  return !isNodeSettled(node);
}

export function nodeStatusLabel(node: ModelNode): string {
  if (node.state === "locked") return "Settled";
  if (node.state === "proposed") return "Emerging";
  if (node.state === "uncertain") return "Uncertain";
  if (node.confidence >= UNSETTLED_CONFIDENCE) return "Stable";
  if (node.confidence >= 50) return "Observe";
  return "Uncertain";
}

export function recommendationLabel(rec: PressureRecommendation): string {
  return rec.charAt(0).toUpperCase() + rec.slice(1);
}

export function architectBeliefForPressure(pressure: ArchitecturalPressure): string {
  if (pressure.recommendationDetail && !pressure.recommendationDetail.includes("%")) {
    const trimmed = pressure.recommendationDetail
      .replace(/^Observe\.\s*/i, "")
      .replace(/^Keep unified\.\s*/i, "")
      .replace(/^Prepare\.\s*/i, "")
      .replace(/^Split\.\s*/i, "")
      .trim();
    if (trimmed.length > 20) return trimmed;
  }

  switch (pressure.recommendation) {
    case "stable":
      return pressure.kind === "specialize"
        ? "The unified model still holds. Reality has not yet earned a split."
        : "Current structure holds. No architectural change warranted yet.";
    case "observe":
      return "Evidence is accumulating, but reality has not yet earned a split.";
    case "prepare":
      return "A pattern is forming. Gather more evidence before restructuring.";
    case "split":
      return "Reality now supports specialization. The ontology may need to evolve.";
  }
}

export function formatEvidenceBrief(
  evidence: ArchitecturalPressure["evidence"],
): string | null {
  const rows = evidence.filter((e) => e.count > 0);
  if (rows.length === 0) return null;
  return rows.map((e) => `${e.count} ${e.label.toLowerCase()}`).join(" · ");
}

export function pressuresNeedingAttention(
  pressures: ArchitecturalPressure[],
): ArchitecturalPressure[] {
  return pressures.filter((p) => p.recommendation !== "stable");
}

export function isRelationshipUnsettled(rel: ModelRelationship): boolean {
  return rel.confidence < UNSETTLED_CONFIDENCE;
}

export function relationshipBelief(rel: ModelRelationship): string {
  if (rel.confidence >= UNSETTLED_CONFIDENCE) {
    return `${rel.fromLabel} ${rel.label} ${rel.toLabel} — relationship is clear.`;
  }
  if (rel.confidence >= 50) {
    return `${rel.fromLabel} → ${rel.toLabel} is forming, but the link is not yet settled.`;
  }
  return `${rel.fromLabel} → ${rel.toLabel} remains architecturally open.`;
}

export function isArchitectureContested(model: ArchitectMentalModel): boolean {
  if (model.options.length < 2) return false;
  const recommended = model.options.find((o) => o.id === model.recommendedOptionId);
  if (!recommended) return true;
  const sorted = [...model.options].sort((a, b) => b.confidence - a.confidence);
  const runnerUp = sorted.find((o) => o.id !== recommended.id);
  if (!runnerUp) return false;
  return recommended.confidence - runnerUp.confidence < 18;
}

export function optionBelief(
  option: ArchitectMentalModel["options"][number],
  isRecommended: boolean,
): string {
  if (isRecommended) return option.reason;
  return `Less likely — ${option.reason}`;
}

const CHANGE_LANGUAGE: Record<
  ModelChangeType,
  (summary: string) => string
> = {
  new_node: (s) => `New concept emerged — ${s}`,
  boundary_moved: (s) => `Boundary settled — ${s}`,
  new_relationship: (s) => `Relationship strengthened — ${s}`,
  node_split: (s) => `Reality now supports specialization — ${s}`,
  assumption_locked: (s) => `Assumption locked — ${s}`,
};

export function changeToLivingLanguage(change: ModelChange): string {
  const formatter = CHANGE_LANGUAGE[change.type];
  return formatter ? formatter(change.summary) : change.summary;
}

export function modelDeltaMessage(model: ArchitectMentalModel): string {
  const parts: string[] = [];

  if (model.changes.length > 0) {
    parts.push(model.changes.map(changeToLivingLanguage).join("\n"));
  }

  const active = pressuresNeedingAttention(model.pressures ?? []);
  if (active[0]) {
    parts.push(
      `${active[0].nodeLabel}: ${architectBeliefForPressure(active[0])}`,
    );
  }

  const recommended = model.options.find((o) => o.id === model.recommendedOptionId);
  if (recommended && isArchitectureContested(model)) {
    parts.push(`Leading structure: ${recommended.label}.`);
  } else if (recommended && !isArchitectureContested(model)) {
    parts.push(`Structure settling toward ${recommended.label.replace(/^Option [A-Z] — /, "")}.`);
  }

  if (parts.length === 0) {
    return "The model holds. No new uncertainty surfaced.";
  }

  return parts.join("\n\n");
}

export function pressureObservation(pressure: ArchitecturalPressure): string {
  return `${pressure.nodeLabel}: ${architectBeliefForPressure(pressure)}`;
}

export function pressuresToBeliefs(pressures: ArchitecturalPressure[]): string[] {
  return pressuresNeedingAttention(pressures).map(pressureObservation);
}

export function hasUnsettledModel(model: ArchitectMentalModel): boolean {
  const childNodes = model.nodes.filter((n) => n.id !== model.rootId);
  return (
    pressuresNeedingAttention(model.pressures ?? []).length > 0 ||
    childNodes.some(isNodeFocus) ||
    model.relationships.some(isRelationshipUnsettled) ||
    isArchitectureContested(model)
  );
}
