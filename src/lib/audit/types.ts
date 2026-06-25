import type { ProtectedDomainDetection } from "@/lib/protected-domains/types";

export type AuditScope = {
  title: string;
  targetSubsystem: string;
  summary: string;
  affectedDomains: ProtectedDomainDetection[];
  scopeAreas: string[];
  evaluationQuestions: string[];
  polishThemes: string[];
  recommendedNextStep: string;
};

export type AuditSessionView = {
  id: string;
  projectSlug: string;
  captureId: string;
  status: string;
  originalInput: string;
  scope: AuditScope | null;
  initiativeId: string | null;
  createdAt: string;
  updatedAt: string;
};
