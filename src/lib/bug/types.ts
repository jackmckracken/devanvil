import type { ProtectedDomainDetection } from "@/lib/protected-domains/types";

export type BugWorkItemResult = {
  workItemId: string;
  captureId: string;
  title: string;
  acceptanceCriteria: string[];
  affectedDomains: string[];
  projectSlug: string;
};

export type BugAnalysis = {
  title: string;
  summary: string;
  symptom: string;
  acceptanceCriteria: string[];
  affectedDomains: ProtectedDomainDetection[];
  recommendedNextStep: string;
};
