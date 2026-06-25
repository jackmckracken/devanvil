#!/usr/bin/env node
import "dotenv/config";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { requireMcpToken } from "@/mcp/auth";
import { McpToolError } from "@/mcp/errors";
import {
  createItemSchema,
  DEV_ITEM_STATUSES,
  generateFeaturePromptSchema,
  getInitiativeSchema,
  getItemSchema,
  getReadyItemsSchema,
  INITIATIVE_PRIORITIES,
  INITIATIVE_STATUSES,
  ITEM_TYPES,
  linkBranchSchema,
  linkItemToInitiativeSchema,
  portfolioFocusSchema,
  PRIORITIES,
  protectedDomainArtifactsSchema,
  protectedDomainAuditSchema,
  protectedDomainChangeGatesSchema,
  protectedDomainChecklistSchema,
  protectedDomainRecentChangesSchema,
  protectedDomainStatusSchema,
  protectedDomainsSchema,
  detectProtectedDomainsSchema,
  getProtectedDomainSchema,
  searchInitiativesSchema,
  searchItemsSchema,
  SOURCE_TYPES,
  STRATEGIC_VALUES,
  updateItemStatusSchema,
} from "@/mcp/schemas";
import { linkBranch } from "@/mcp/services/builds";
import { generateFeaturePromptResult } from "@/mcp/services/feature-prompt";
import {
  getInitiative,
  getReadyItemsMcp,
  linkItemToInitiative,
  portfolioFocus,
  searchInitiatives,
} from "@/mcp/services/initiatives";
import {
  createItem,
  getItem,
  searchItems,
  updateItemStatus,
} from "@/mcp/services/items";
import {
  detectProtectedDomainsMcp,
  getProtectedDomainMcp,
  protectedDomainArtifactsMcp,
  protectedDomainAuditMcp,
  protectedDomainChangeGatesMcp,
  protectedDomainChecklistMcp,
  protectedDomainRecentChangesMcp,
  protectedDomainStatusMcp,
  protectedDomainsMcp,
} from "@/mcp/services/protected-domains";

function toolResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function toolError(error: unknown) {
  const message =
    error instanceof McpToolError
      ? error.message
      : error instanceof z.ZodError
        ? error.issues.map((issue) => issue.message).join("; ")
        : error instanceof Error
          ? error.message
          : "Unknown error";

  return {
    isError: true as const,
    content: [{ type: "text" as const, text: message }],
  };
}

function registerTools(server: McpServer) {
  server.registerTool(
    "search_items",
    {
      description:
        "Search DevAnvil intake items by query, project, status, and type.",
      inputSchema: {
        query: z
          .string()
          .optional()
          .describe("Free-text search across title, raw text, and summary"),
        projectSlug: z
          .string()
          .optional()
          .describe("Filter by project slug (e.g. studioops, levrops)"),
        status: z
          .enum(DEV_ITEM_STATUSES)
          .optional()
          .describe("Filter by item status"),
        itemType: z.enum(ITEM_TYPES).optional().describe("Filter by item type"),
        priority: z
          .enum(PRIORITIES)
          .optional()
          .describe("Filter by priority: unset, low, medium, high, urgent"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Max results (default 25)"),
      },
    },
    async (args) => {
      try {
        const input = searchItemsSchema.parse(args);
        return toolResult(await searchItems(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "get_item",
    {
      description: "Fetch a single DevAnvil item by ID with full detail.",
      inputSchema: {
        itemId: z.string().describe("DevAnvil item ID"),
      },
    },
    async (args) => {
      try {
        const input = getItemSchema.parse(args);
        return toolResult(await getItem(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "update_item_status",
    {
      description:
        "Update a DevAnvil item status and append an activity log entry.",
      inputSchema: {
        itemId: z.string().describe("DevAnvil item ID"),
        status: z
          .enum(DEV_ITEM_STATUSES)
          .describe(
            "New status: captured, triaged, approved, in_build, shipped, duplicate, rejected, archived",
          ),
        note: z
          .string()
          .optional()
          .describe("Optional note for the activity log"),
      },
    },
    async (args) => {
      try {
        const input = updateItemStatusSchema.parse(args);
        return toolResult(await updateItemStatus(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "link_branch",
    {
      description: "Link a repository branch to a DevAnvil item.",
      inputSchema: {
        itemId: z.string().describe("DevAnvil item ID"),
        repo: z
          .string()
          .describe("Repository name or path (e.g. levrops, studioops)"),
        branchName: z.string().describe("Git branch name"),
        note: z
          .string()
          .optional()
          .describe("Optional note for the activity log"),
        planDocPath: z
          .string()
          .optional()
          .describe("Path to forge/feature plan doc (e.g. docs/forge/plans/DEV-123-slug.md)"),
        contractReportPath: z
          .string()
          .optional()
          .describe("Path to contract impact report"),
        commandUsed: z
          .string()
          .optional()
          .describe("Slash command used (e.g. /forge_ship)"),
      },
    },
    async (args) => {
      try {
        const input = linkBranchSchema.parse(args);
        return toolResult(await linkBranch(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "generate_feature_prompt",
    {
      description:
        "Generate a copy-ready /feature_build prompt for a DevAnvil item.",
      inputSchema: {
        itemId: z.string().describe("DevAnvil item ID"),
        repo: z
          .string()
          .optional()
          .describe("Target repository name (defaults to project slug)"),
        projectSlug: z
          .string()
          .optional()
          .describe("Override project slug for instructions"),
        includeContext: z
          .boolean()
          .optional()
          .describe("Include activity, builds, and project description"),
      },
    },
    async (args) => {
      try {
        const input = generateFeaturePromptSchema.parse(args);
        return toolResult(await generateFeaturePromptResult(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "create_item",
    {
      description:
        "Create a new DevAnvil item using the intake and classification pipeline.",
      inputSchema: {
        text: z.string().describe("Raw idea or intake text"),
        projectHint: z
          .string()
          .optional()
          .describe("Project slug hint for classification"),
        sourceType: z
          .enum(SOURCE_TYPES)
          .optional()
          .describe("Source type: note, voice, text, link, manual"),
        itemType: z
          .enum(ITEM_TYPES)
          .optional()
          .describe("Override classified item type"),
        status: z
          .enum(DEV_ITEM_STATUSES)
          .optional()
          .describe("Override initial status (default: captured or duplicate)"),
      },
    },
    async (args) => {
      try {
        const input = createItemSchema.parse(args);
        return toolResult(await createItem(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "search_initiatives",
    {
      description:
        "Search DevAnvil initiatives by project, status, priority, and strategic value.",
      inputSchema: {
        projectSlug: z
          .string()
          .optional()
          .describe("Filter by project slug (e.g. studioops)"),
        status: z
          .enum(INITIATIVE_STATUSES)
          .optional()
          .describe("Initiative status filter"),
        strategicValue: z
          .enum(STRATEGIC_VALUES)
          .optional()
          .describe("Strategic value filter"),
        priority: z
          .enum(INITIATIVE_PRIORITIES)
          .optional()
          .describe("Initiative priority filter"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Max results (default 25)"),
      },
    },
    async (args) => {
      try {
        const input = searchInitiativesSchema.parse(args);
        return toolResult(await searchInitiatives(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "get_initiative",
    {
      description:
        "Fetch initiative detail with linked items, scores, blockers, and status counts.",
      inputSchema: {
        initiativeId: z.string().describe("DevAnvil initiative ID"),
      },
    },
    async (args) => {
      try {
        const input = getInitiativeSchema.parse(args);
        return toolResult(await getInitiative(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "get_ready_items",
    {
      description:
        "Return ranked ready-for-build items for Forge. Ready = approved OR high/urgent priority. Prefers active initiatives, then next, then backlog.",
      inputSchema: {
        projectSlug: z
          .string()
          .describe("Project slug (e.g. studioops)"),
        activeOnly: z
          .boolean()
          .optional()
          .describe(
            "When true, only items linked to active or next initiatives",
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Max results (default 25)"),
      },
    },
    async (args) => {
      try {
        const input = getReadyItemsSchema.parse(args);
        return toolResult(await getReadyItemsMcp(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "link_item_to_initiative",
    {
      description: "Link a DevAnvil item to an initiative and log activity.",
      inputSchema: {
        itemId: z.string().describe("DevAnvil item ID"),
        initiativeId: z.string().describe("DevAnvil initiative ID"),
        note: z
          .string()
          .optional()
          .describe("Optional activity log note"),
      },
    },
    async (args) => {
      try {
        const input = linkItemToInitiativeSchema.parse(args);
        return toolResult(await linkItemToInitiative(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "portfolio_focus",
    {
      description:
        "Return portfolio execution plan: top initiatives, ready items, blockers, warnings, and recommended next Forge action.",
      inputSchema: {
        projectSlug: z
          .string()
          .describe("Project slug (e.g. studioops)"),
      },
    },
    async (args) => {
      try {
        const input = portfolioFocusSchema.parse(args);
        return toolResult(await portfolioFocus(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "protected_domains",
    {
      description:
        "List Protected Domains — architectural boundaries that require governance before modification.",
      inputSchema: {
        projectSlug: z
          .string()
          .optional()
          .describe("Filter by project slug (e.g. studioops)"),
      },
    },
    async (args) => {
      try {
        const input = protectedDomainsSchema.parse(args);
        return toolResult(await protectedDomainsMcp(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "get_protected_domain",
    {
      description: "Fetch full Protected Domain detail including artifacts, gates, and extension points.",
      inputSchema: {
        slug: z.string().describe("Protected domain slug (e.g. bloom-runtime)"),
      },
    },
    async (args) => {
      try {
        const input = getProtectedDomainSchema.parse(args);
        return toolResult(await getProtectedDomainMcp(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "protected_domain_status",
    {
      description:
        "Return Protected Domain status summary: protection level, owner, versions, gates, and violations.",
      inputSchema: {
        slug: z.string().describe("Protected domain slug"),
      },
    },
    async (args) => {
      try {
        const input = protectedDomainStatusSchema.parse(args);
        return toolResult(await protectedDomainStatusMcp(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "protected_domain_artifacts",
    {
      description:
        "List artifacts for a Protected Domain (ADRs, contracts, catalogs, golden masters, inventories, tests).",
      inputSchema: {
        slug: z.string().describe("Protected domain slug"),
      },
    },
    async (args) => {
      try {
        const input = protectedDomainArtifactsSchema.parse(args);
        return toolResult(await protectedDomainArtifactsMcp(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "protected_domain_change_gates",
    {
      description:
        "Return mandatory change gates, allowed extension points, and blocked changes for a Protected Domain.",
      inputSchema: {
        slug: z.string().describe("Protected domain slug"),
      },
    },
    async (args) => {
      try {
        const input = protectedDomainChangeGatesSchema.parse(args);
        return toolResult(await protectedDomainChangeGatesMcp(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "protected_domain_checklist",
    {
      description:
        "Evaluate change gate checklist for a Protected Domain. Forge must not mark work complete until required gates pass.",
      inputSchema: {
        slug: z.string().describe("Protected domain slug"),
        gateResults: z
          .record(z.string(), z.boolean())
          .optional()
          .describe("Map of gate name to pass/fail status"),
      },
    },
    async (args) => {
      try {
        const input = protectedDomainChecklistSchema.parse(args);
        return toolResult(await protectedDomainChecklistMcp(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "protected_domain_audit",
    {
      description: "Record an audit entry for a Protected Domain and update last audit timestamp.",
      inputSchema: {
        slug: z.string().describe("Protected domain slug"),
        note: z.string().describe("Audit note or summary"),
        auditor: z.string().optional().describe("Auditor name or agent"),
        passed: z.boolean().optional().describe("Whether audit passed (default true)"),
      },
    },
    async (args) => {
      try {
        const input = protectedDomainAuditSchema.parse(args);
        return toolResult(await protectedDomainAuditMcp(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "protected_domain_recent_changes",
    {
      description: "List open and recent changes tracked for a Protected Domain.",
      inputSchema: {
        slug: z.string().describe("Protected domain slug"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Max recent changes (default 10)"),
      },
    },
    async (args) => {
      try {
        const input = protectedDomainRecentChangesSchema.parse(args);
        return toolResult(await protectedDomainRecentChangesMcp(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "detect_protected_domains",
    {
      description:
        "Detect when a task intersects Protected Domains. Returns matched domains, required gates, prohibited work, and a Forge warning block. Call before planning Forge work.",
      inputSchema: {
        text: z
          .string()
          .describe("Task description, item title, or plan text to analyze"),
        paths: z
          .array(z.string())
          .optional()
          .describe("File paths being modified"),
        projectSlug: z
          .string()
          .optional()
          .describe("Project slug for scoping domains"),
      },
    },
    async (args) => {
      try {
        const input = detectProtectedDomainsSchema.parse(args);
        return toolResult(await detectProtectedDomainsMcp(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );
}

async function main() {
  requireMcpToken();

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not configured. Set it in your environment before starting the MCP server.",
    );
  }

  const server = new McpServer(
    {
      name: "devanvil",
      version: "1.0.0",
    },
    {
      instructions:
        "DevAnvil MCP server for intake items, initiatives, portfolio focus, Protected Domains, and Forge-ready item ranking. Tools are prefixed devanvil in Cursor (e.g. devanvil.get_ready_items). StudioOps Forge: portfolio_focus → get_ready_items → forge_pick. Before planning work in a governed subsystem, call devanvil.detect_protected_domains or devanvil.get_protected_domain.",
    },
  );

  registerTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(
    "DevAnvil MCP server failed to start:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
