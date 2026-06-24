import type { CurationState, DevItemStatus, ItemType } from "@/generated/prisma/client";

export type CurationItem = {
  id: string;
  title: string;
  rawText: string;
  normalizedSummary: string;
  itemType: ItemType;
  status: DevItemStatus;
  externalKey: string | null;
  curationState: CurationState;
  qualityScore: number | null;
  importOnly: boolean;
  sourceFile?: string;
  sourceHeading?: string;
};

export type JunkVerdict = {
  isJunk: boolean;
  reason: string;
  confidence: number;
};

export type TitleNormalization = {
  original: string;
  normalized: string;
  changed: boolean;
  reason: string;
};

export type DuplicateGroup = {
  canonicalId: string;
  canonicalTitle: string;
  members: Array<{
    id: string;
    title: string;
    similarity: number;
    curationState: "duplicate" | "merge_candidate";
  }>;
};

export type Cluster = {
  id: string;
  name: string;
  itemIds: string[];
  keywords: string[];
};

export type CurationReport = {
  runAt: string;
  projectSlug: string;
  dryRun: boolean;
  totalScanned: number;
  junkArchived: number;
  renamed: number;
  duplicateGroups: DuplicateGroup[];
  clusters: Cluster[];
  errors: Array<{ itemId?: string; title?: string; error: string }>;
  manualReview: Array<{
    itemId: string;
    title: string;
    reason: string;
  }>;
  junkCandidates: Array<{ id: string; title: string; reason: string }>;
  renameCandidates: Array<{ id: string; from: string; to: string; reason: string }>;
};
