import type { ArchitectAssumption } from "@/lib/architect/types";

export type PressureKind =
  | "specialize"
  | "merge"
  | "subtypes"
  | "reference_link"
  | "boundary_shift";

export type PressureRecommendation = "stable" | "observe" | "prepare" | "split";

export type PressureEvidence = {
  label: string;
  count: number;
};

/** Evidence-driven signal that reality may require ontology evolution */
export type ArchitecturalPressure = {
  nodeId: string;
  nodeLabel: string;
  kind: PressureKind;
  label: string;
  level: number;
  status: PressureRecommendation | "stable";
  evidence: PressureEvidence[];
  recommendation: PressureRecommendation;
  recommendationDetail: string;
};

export type ModelNodeKind =
  | "root"
  | "domain"
  | "concept"
  | "subsystem"
  | "actor"
  | "capability";

export type ModelNodeState = "existing" | "proposed" | "uncertain" | "locked";

export type ModelChangeType =
  | "new_node"
  | "boundary_moved"
  | "new_relationship"
  | "node_split"
  | "assumption_locked";

export type ModelNode = {
  id: string;
  label: string;
  kind: ModelNodeKind;
  parentId: string | null;
  annotation?: string;
  confidence: number;
  assumptions: ArchitectAssumption[];
  state: ModelNodeState;
};

export type ModelRelationship = {
  id: string;
  fromLabel: string;
  toLabel: string;
  label: string;
  confidence: number;
};

export type ModelOption = {
  id: string;
  label: string;
  preview: string;
  confidence: number;
  reason: string;
};

export type ModelChange = {
  type: ModelChangeType;
  summary: string;
};

/** v3 primary artifact — conversation exists to improve this model */
export type ArchitectMentalModel = {
  version: 3;
  rootId: string;
  nodes: ModelNode[];
  relationships: ModelRelationship[];
  options: ModelOption[];
  recommendedOptionId: string | null;
  changes: ModelChange[];
  /** @deprecated Use pressures — taxonomy questions violate Reality Over Assumption */
  openQuestions?: string[];
  pressures: ArchitecturalPressure[];
};
