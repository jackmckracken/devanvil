import type {
  CurationState,
  DevItemStatus,
  ItemType,
  Priority,
  SourceType,
} from "@/generated/prisma/client";

export type IntakeRequest = {
  text: string;
  sourceType?: SourceType | "url" | "screenshot";
  projectHint?: string;
  title?: string;
  url?: string;
  platform?: string;
  sharedAt?: string;
  metadata?: Record<string, unknown>;
};

export type MatchResult = {
  itemId: string;
  title: string;
  project: string;
  similarityScore: number;
  matchReason: string;
};

export type ClassificationResult = {
  itemId: string;
  project: string;
  projectSlug: string;
  itemType: ItemType;
  status: DevItemStatus;
  title: string;
  summary: string;
  matches: MatchResult[];
  suggestedBranchName: string;
  suggestedCommand: string;
  confidenceScore: number;
};

export type QueueFilters = {
  project?: string;
  itemType?: ItemType;
  status?: DevItemStatus;
  priority?: Priority;
  search?: string;
};

export const STATUS_LABELS: Record<DevItemStatus, string> = {
  captured: "Captured",
  triaged: "Triaged",
  approved: "Approved",
  in_build: "In Build",
  shipped: "Shipped",
  duplicate: "Duplicate",
  rejected: "Rejected",
  archived: "Archived",
};

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  feature: "Feature",
  bug: "Bug",
  regression: "Regression",
  decision: "Decision",
  question: "Question",
  chore: "Chore",
  opportunity: "Opportunity",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  unset: "Unset",
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  note: "Note",
  voice: "Voice",
  text: "Text",
  link: "Link",
  manual: "Manual",
};

export const TRIAGE_ACTIONS: DevItemStatus[] = [
  "triaged",
  "approved",
  "in_build",
  "shipped",
  "duplicate",
  "rejected",
];

export const CURATION_STATE_LABELS: Record<CurationState, string> = {
  unreviewed: "Unreviewed",
  keep: "Keep",
  archive_junk: "Junk",
  duplicate: "Duplicate",
  merge_candidate: "Merge Candidate",
  canonical: "Canonical",
};
