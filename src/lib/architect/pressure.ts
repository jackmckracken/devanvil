import type { ArchitectEvidence, CapabilityFamily } from "@/lib/architect/evidence-types";
import { familyEvidenceRows } from "@/lib/architect/evidence-types";
import type {
  ArchitecturalPressure,
  ModelNode,
  PressureKind,
  PressureRecommendation,
} from "@/lib/architect/mental-model-types";

const RECOMMENDATION_COPY: Record<
  PressureRecommendation,
  { headline: string; detail: string }
> = {
  stable: {
    headline: "Keep unified.",
    detail: "Re-evaluate after significant additional evidence.",
  },
  observe: {
    headline: "Observe.",
    detail: "Continue gathering evidence. Pattern emerging but not yet earned.",
  },
  prepare: {
    headline: "Prepare.",
    detail: "Likely future specialization — collect more evidence before splitting.",
  },
  split: {
    headline: "Split.",
    detail: "Reality now justifies architectural evolution.",
  },
};

export function recommendationFromLevel(level: number): PressureRecommendation {
  if (level < 25) return "stable";
  if (level < 50) return "observe";
  if (level < 75) return "prepare";
  return "split";
}

export function recommendationText(level: number, context?: string): string {
  const rec = RECOMMENDATION_COPY[recommendationFromLevel(level)];
  const suffix = context ? ` ${context}` : "";
  return `${rec.headline} ${rec.detail}${suffix}`;
}

/** Pressure rises from evidence volume and family spread — never from chat alone. */
export function computeSpecializePressure(evidence: ArchitectEvidence): number {
  const families = Object.values(evidence.capabilityFamilies);
  const total = evidence.completedInvestments;
  if (total === 0) return 0;

  const spread = families.filter((c) => c > 0).length;
  const maxShare = Math.max(...families) / total;
  const diversity = 1 - maxShare;

  const level = Math.round(
    diversity * 40 + Math.min(total, 50) * 1.2 + spread * 5,
  );
  return Math.min(100, Math.max(0, level));
}

export function computeReferencePressure(
  evidence: ArchitectEvidence,
  linked: boolean,
): number {
  if (linked) return 0;
  if (evidence.completedInvestments === 0) return 0;
  return Math.min(
    100,
    Math.round(12 + evidence.completedInvestments * 2 + evidence.architectDiscussions * 3),
  );
}

export function computeMergePressure(
  evidence: ArchitectEvidence,
  boundaryLocked: boolean,
): number {
  if (boundaryLocked) return 0;
  if (evidence.architectDiscussions < 2) return 0;
  return Math.min(35, evidence.architectDiscussions * 8);
}

export function computeSubtypePressure(
  childCount: number,
  evidence: ArchitectEvidence,
): number {
  if (childCount < 4) return 0;
  return Math.min(
    60,
    Math.round(childCount * 4 + evidence.completedWorkItems * 0.5),
  );
}

function pressureEntry(
  node: ModelNode,
  kind: PressureKind,
  label: string,
  level: number,
  evidence: { label: string; count: number }[],
  detail?: string,
): ArchitecturalPressure {
  const recommendation = recommendationFromLevel(level);
  const copy = RECOMMENDATION_COPY[recommendation];
  return {
    nodeId: node.id,
    nodeLabel: node.label,
    kind,
    label,
    level,
    status: node.state === "locked" ? "stable" : recommendation,
    evidence,
    recommendation,
    recommendationDetail: detail ?? `${copy.headline} ${copy.detail}`,
  };
}

export function computeNodePressures(
  nodes: ModelNode[],
  evidence: ArchitectEvidence,
  options?: { momentumLinked?: boolean; practiceBoundaryLocked?: boolean },
): ArchitecturalPressure[] {
  const pressures: ArchitecturalPressure[] = [];
  const rootChildren = nodes.filter((n) => n.parentId && n.parentId === nodes.find((r) => r.kind === "root")?.id);

  for (const node of nodes) {
    if (node.label === "Capability") {
      const level = computeSpecializePressure(evidence);
      const familyRows = familyEvidenceRows(evidence.capabilityFamilies);
      const hasEvidence = evidence.completedInvestments > 0;

      pressures.push(
        pressureEntry(
          node,
          "specialize",
          "Pressure to specialize",
          hasEvidence ? level : 0,
          hasEvidence
            ? familyRows
            : [{ label: "Completed investments", count: 0 }],
          hasEvidence
            ? recommendationText(
                level,
                level < 50
                  ? " Re-evaluate after more completed Creative Investments."
                  : undefined,
              )
            : "No completed investments yet — unified model is appropriate.",
        ),
      );
      continue;
    }

    if (node.label === "Momentum") {
      const level = computeReferencePressure(evidence, options?.momentumLinked ?? false);
      if (level > 0) {
        pressures.push(
          pressureEntry(
            node,
            "reference_link",
            "Pressure to reference Creative Investments",
            level,
            [
              { label: "Completed investments", count: evidence.completedInvestments },
              { label: "Architect discussions", count: evidence.architectDiscussions },
            ],
            recommendationText(level),
          ),
        );
      }
      continue;
    }

    if (node.label === "Practice") {
      const level = computeMergePressure(
        evidence,
        options?.practiceBoundaryLocked ?? node.state === "locked",
      );
      if (level > 0) {
        pressures.push(
          pressureEntry(
            node,
            "merge",
            "Pressure to merge with adjacent domain",
            level,
            [{ label: "Boundary discussions", count: evidence.architectDiscussions }],
            recommendationText(level),
          ),
        );
      }
      continue;
    }

    if (node.kind === "root" && node.label === "Artist") {
      const level = computeSubtypePressure(rootChildren.length, evidence);
      if (level > 0) {
        pressures.push(
          pressureEntry(
            node,
            "subtypes",
            "Pressure to introduce subtypes",
            level,
            [
              { label: "Child domains", count: rootChildren.length },
              { label: "Completed work", count: evidence.completedWorkItems },
            ],
            recommendationText(level),
          ),
        );
      }
    }
  }

  return pressures;
}

export function pressureSummary(pressure: ArchitecturalPressure): string {
  return `${pressure.nodeLabel}: ${pressure.recommendationDetail} (${pressure.level}% ${pressure.label.toLowerCase()})`;
}

export function pressuresToObservations(pressures: ArchitecturalPressure[]): string[] {
  return pressures
    .filter((p) => p.level > 0 || p.nodeLabel === "Capability")
    .map(pressureSummary);
}

/** Demo evidence when DB is sparse but the session is about Creative Investments. */
export function demoEvidenceForExchange(exchangeCount: number): ArchitectEvidence {
  const families: Record<CapabilityFamily, number> = {
    technical: 0,
    creative: 0,
    performance: 0,
    business: 0,
  };

  if (exchangeCount === 0) {
    return {
      completedInvestments: 0,
      totalInvestments: 0,
      capabilityFamilies: families,
      completedWorkItems: 0,
      captures: 1,
      architectDiscussions: 1,
      featureRequests: 0,
      regressions: 0,
    };
  }

  if (exchangeCount <= 2) {
    families.technical = 4;
    families.creative = 1;
    families.performance = 1;
    return {
      completedInvestments: 6,
      totalInvestments: 8,
      capabilityFamilies: families,
      completedWorkItems: 3,
      captures: 2,
      architectDiscussions: exchangeCount + 1,
      featureRequests: 1,
      regressions: 0,
    };
  }

  families.technical = 18;
  families.creative = 12;
  families.performance = 9;
  families.business = 8;
  return {
    completedInvestments: 47,
    totalInvestments: 52,
    capabilityFamilies: families,
    completedWorkItems: 24,
    captures: 6,
    architectDiscussions: exchangeCount + 3,
    featureRequests: 4,
    regressions: 1,
  };
}

export function mergeEvidence(
  live: ArchitectEvidence,
  demo: ArchitectEvidence,
): ArchitectEvidence {
  if (live.completedInvestments > 0) return live;
  return demo;
}
