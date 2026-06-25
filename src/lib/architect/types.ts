import type { ProtectedDomainDetection } from "@/lib/protected-domains/types";
import type { ArchitecturalMemoryHit, SuggestedInitiative } from "@/lib/workflow/types";
import type { ArchitectMentalModel } from "@/lib/architect/mental-model-types";

export type ConceptConfidence = "high" | "medium" | "low";

export type AssumptionStatus = "locked" | "open";

export type ArchitectAssumption = {
  text: string;
  status: AssumptionStatus;
};

export type PotentialConcept = {
  name: string;
  confidence: ConceptConfidence;
  reasoning: string;
};

export type ArchitectMessage = {
  id: string;
  role: "user" | "architect";
  content: string;
  createdAt: string;
};

export type ArchitectAnalysis = {
  /** v3 — primary artifact; conversation exists to improve this model */
  mentalModel?: ArchitectMentalModel;

  /** v2 — derived from model for initiative export + legacy */
  currentUnderstanding: string;
  confidence: number;
  assumptions: ArchitectAssumption[];
  decisionsLocked: string[];
  remainingUnknowns: string[];
  strongOpinions: string[];

  /** Structured fields used for initiative + memory */
  intent: string;
  problemStatement: string;
  successCriteria: string[];
  nonGoals: string[];
  potentialConcepts: PotentialConcept[];
  architecturalQuestions: string[];
  affectedProductDomains: string[];
  affectedProtectedDomains: ProtectedDomainDetection[];
  suggestedInitiative: {
    title: string;
    description: string;
    strategicValue?: string;
  };
  suggestedEpics: string[];
  architecturalRisks: string[];
  relatedMemory: ArchitecturalMemoryHit[];
  relatedInitiatives: SuggestedInitiative[];
  relatedRecords: { title: string; kind: string; path?: string | null }[];
  recommendation: string;
  /** Chat turn — ends with what Architect now believes */
  architectMessage: string;
};

export type ArchitectSessionView = {
  id: string;
  projectSlug: string;
  captureId: string | null;
  status: string;
  originalInput: string;
  analysis: ArchitectAnalysis | null;
  messages: ArchitectMessage[];
  initiativeId: string | null;
  createdAt: string;
  updatedAt: string;
};
