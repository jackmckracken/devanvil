import type { WorkflowCommand } from "@/generated/prisma/client";
import type { ProtectedDomainDetection } from "@/lib/protected-domains/types";
import type { InvestmentClassification } from "@/lib/investments/classify";
import type { MatchResult } from "@/lib/types";

export type { WorkflowCommand };

export type ChangeCategory =
  | "Bug Fix"
  | "Polish"
  | "Refactor"
  | "Architectural Change"
  | "Intent Evolution"
  | "Feature"
  | "Documentation";

export type SuggestedWorkItem = {
  title: string;
  itemType: string;
  summary: string;
  rationale: string;
};

export type SuggestedInitiative = {
  id?: string;
  title: string;
  rationale: string;
  isNew: boolean;
};

export type ArchitecturalMemoryHit = {
  source:
    | "intake"
    | "initiative"
    | "work_item"
    | "domain"
    | "domain_change"
    | "investment";
  id: string;
  title: string;
  snippet: string;
  relevance: number;
  href: string;
};

export type ArchitecturalIntakeResult = {
  command: WorkflowCommand;
  intent: string;
  domains: ProtectedDomainDetection[];
  memory: ArchitecturalMemoryHit[];
  relatedInitiatives: SuggestedInitiative[];
  relatedWorkItems: MatchResult[];
  suggestedInitiative: SuggestedInitiative | null;
  suggestedWorkItems: SuggestedWorkItem[];
  changeCategory: ChangeCategory | null;
  recommendedNextStep: string;
  protectionSummary: {
    highestLevel: string | null;
    requiredContracts: string[];
    requiredEvidence: string[];
    requiredTests: string[];
  };
  investigation?: {
    title: string;
    hypotheses: string[];
    suggestedSteps: string[];
    affectedDomains: string[];
  };
  shipReport?: {
    gates: { name: string; passed: boolean; required: boolean }[];
    protectedDomainsChecked: string[];
    evidenceRequired: string[];
    readyToShip: boolean;
    blockers: string[];
  };
  investment?: {
    classification: InvestmentClassification;
    categoryLabel: string;
    leverageLabel: string;
    relatedInitiatives: SuggestedInitiative[];
  };
};

export type WorkflowProcessInput = {
  text: string;
  projectSlug: string;
  command?: WorkflowCommand;
};

export type WorkflowProcessOutput = {
  intakeId: string;
  result: ArchitecturalIntakeResult;
  briefMarkdown: string;
  investmentId?: string;
};
