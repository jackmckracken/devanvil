import type { CapturePromotion, SourceType } from "@/generated/prisma/client";

export type CaptureResult = {
  captureId: string;
  project: string;
  projectSlug: string;
  status: "captured";
  rawText: string;
  sourceType: SourceType;
  createdAt: string;
};

export type CaptureView = {
  id: string;
  projectSlug: string;
  rawText: string;
  title: string;
  sourceType: SourceType;
  status: string;
  promotedTo: CapturePromotion | null;
  createdAt: string;
  suggestedMode: TriageSuggestion | null;
};

export type TriageSuggestion = {
  mode: "architect" | "bug" | "audit" | "investment";
  reason: string;
};
