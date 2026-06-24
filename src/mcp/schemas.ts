import { z } from "zod";

export const DEV_ITEM_STATUSES = [
  "captured",
  "triaged",
  "approved",
  "in_build",
  "shipped",
  "duplicate",
  "rejected",
  "archived",
] as const;

export const ITEM_TYPES = [
  "feature",
  "bug",
  "regression",
  "decision",
  "question",
  "chore",
  "opportunity",
] as const;

export const SOURCE_TYPES = [
  "note",
  "voice",
  "text",
  "link",
  "manual",
] as const;

export const PRIORITIES = [
  "unset",
  "low",
  "medium",
  "high",
  "urgent",
] as const;

export const searchItemsSchema = z.object({
  query: z.string().optional(),
  projectSlug: z.string().optional(),
  status: z.enum(DEV_ITEM_STATUSES).optional(),
  itemType: z.enum(ITEM_TYPES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  limit: z.number().int().min(1).max(100).optional().default(25),
});

export const getItemSchema = z.object({
  itemId: z.string().min(1, "itemId is required"),
});

export const updateItemStatusSchema = z.object({
  itemId: z.string().min(1, "itemId is required"),
  status: z.enum(DEV_ITEM_STATUSES),
  note: z.string().optional(),
});

export const linkBranchSchema = z.object({
  itemId: z.string().min(1, "itemId is required"),
  repo: z.string().min(1, "repo is required"),
  branchName: z.string().min(1, "branchName is required"),
  note: z.string().optional(),
  planDocPath: z.string().optional(),
  contractReportPath: z.string().optional(),
  commandUsed: z.string().optional(),
});

export const generateFeaturePromptSchema = z.object({
  itemId: z.string().min(1, "itemId is required"),
  repo: z.string().optional(),
  projectSlug: z.string().optional(),
  includeContext: z.boolean().optional().default(true),
});

export const createItemSchema = z.object({
  text: z.string().min(1, "text is required"),
  projectHint: z.string().optional(),
  sourceType: z.enum(SOURCE_TYPES).optional(),
  itemType: z.enum(ITEM_TYPES).optional(),
  status: z.enum(DEV_ITEM_STATUSES).optional(),
});

export const INITIATIVE_STATUSES = [
  "proposed",
  "active",
  "next",
  "paused",
  "completed",
  "archived",
] as const;

export const INITIATIVE_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export const STRATEGIC_VALUES = [
  "beta_critical",
  "launch_critical",
  "growth",
  "delight",
  "infrastructure",
  "research",
  "future_vision",
] as const;

export const searchInitiativesSchema = z.object({
  projectSlug: z.string().optional(),
  status: z.enum(INITIATIVE_STATUSES).optional(),
  strategicValue: z.enum(STRATEGIC_VALUES).optional(),
  priority: z.enum(INITIATIVE_PRIORITIES).optional(),
  limit: z.number().int().min(1).max(100).optional().default(25),
});

export const getInitiativeSchema = z.object({
  initiativeId: z.string().min(1, "initiativeId is required"),
});

export const getReadyItemsSchema = z.object({
  projectSlug: z.string().min(1, "projectSlug is required"),
  activeOnly: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(100).optional().default(25),
});

export const linkItemToInitiativeSchema = z.object({
  itemId: z.string().min(1, "itemId is required"),
  initiativeId: z.string().min(1, "initiativeId is required"),
  note: z.string().optional(),
});

export const portfolioFocusSchema = z.object({
  projectSlug: z.string().min(1, "projectSlug is required"),
});
