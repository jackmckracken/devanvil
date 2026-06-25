import type { ArchitectAssumption } from "@/lib/architect/types";

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
  openQuestions: string[];
};
