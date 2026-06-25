import type {
  DomainArtifactKind,
  DomainChangeStatus,
  DomainViolationSeverity,
  ExtensionPointCategory,
  ProtectionLevel,
  ProtectedDomainStatus,
  RegressionStatus,
} from "@/generated/prisma/client";

export type ProtectedDomainSummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  owner: string;
  status: ProtectedDomainStatus;
  protectionLevel: ProtectionLevel;
  projectSlug: string | null;
  lastAuditAt: string | null;
  lastGoldenMasterAt: string | null;
  contractVersion: string | null;
  inventoryVersion: string | null;
  regressionStatus: RegressionStatus;
  openChanges: number;
  recentViolations: number;
};

export type ProtectedDomainArtifactSummary = {
  id: string;
  kind: DomainArtifactKind;
  title: string;
  path: string | null;
  version: string | null;
  updatedAt: string;
};

export type ProtectedDomainChangeGateSummary = {
  id: string;
  name: string;
  description: string | null;
  required: boolean;
  sortOrder: number;
};

export type ProtectedDomainExtensionPointSummary = {
  id: string;
  name: string;
  description: string | null;
  category: ExtensionPointCategory;
};

export type ProtectedDomainChangeSummary = {
  id: string;
  title: string;
  description: string | null;
  risk: string | null;
  status: DomainChangeStatus;
  devItemId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProtectedDomainViolationSummary = {
  id: string;
  description: string;
  severity: DomainViolationSeverity;
  resolvedAt: string | null;
  createdAt: string;
};

export type ProtectedDomainAuditSummary = {
  id: string;
  note: string;
  auditor: string | null;
  passed: boolean;
  createdAt: string;
};

export type ProtectedDomainDetail = ProtectedDomainSummary & {
  keywords: string[];
  pathPatterns: string[];
  artifacts: ProtectedDomainArtifactSummary[];
  changeGates: ProtectedDomainChangeGateSummary[];
  extensionPoints: ProtectedDomainExtensionPointSummary[];
  changes: ProtectedDomainChangeSummary[];
  violations: ProtectedDomainViolationSummary[];
  audits: ProtectedDomainAuditSummary[];
};

export type ProtectedDomainDetection = {
  domain: ProtectedDomainSummary;
  matchedKeywords: string[];
  matchedPaths: string[];
  blockedChanges: string[];
  requiredGates: string[];
  risk: "low" | "medium" | "high";
  artifactsToLoad: ProtectedDomainArtifactSummary[];
};

export type ProtectedDomainChecklist = {
  domainSlug: string;
  domainName: string;
  protectionLevel: ProtectionLevel;
  gates: Array<{
    name: string;
    required: boolean;
    passed: boolean;
  }>;
  allRequiredPassed: boolean;
  canMarkComplete: boolean;
};

export type ForgeProtectedDomainWarning = {
  detected: boolean;
  domains: ProtectedDomainDetection[];
  prohibitedWork: Array<{
    domainSlug: string;
    domainName: string;
    change: string;
    requires: string[];
  }>;
};
