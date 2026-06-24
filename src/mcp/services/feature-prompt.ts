import { prisma } from "@/lib/db";
import { buildSuggestedCommand } from "@/lib/text";
import { assertFound } from "@/mcp/errors";
import { getItem } from "@/mcp/services/items";
import type { z } from "zod";
import type { generateFeaturePromptSchema } from "@/mcp/schemas";

type GenerateFeaturePromptInput = z.infer<typeof generateFeaturePromptSchema>;

function projectInstructions(projectSlug: string): string {
  switch (projectSlug) {
    case "studioops":
      return [
        "Follow the StudioOps Forge Command Flow (not LevrOps /feature_*):",
        "",
        "1. /forge_pick — uses devanvil.portfolio_focus + devanvil.get_ready_items",
        "2. /forge_plan — generate plan at docs/forge/plans/DEV-<id>-<slug>.md",
        "3. /forge_review — review plan; verdict PASS before build",
        "4. /forge_build — implement approved plan only",
        "5. /forge_audit — contract impact report at docs/forge/reports/",
        "6. /forge_ship — mark shipped in DevAnvil, link branch and artifacts",
        "",
        "Before planning or modifying code, read (in order):",
        "1. docs/studioops-development-control-center.md",
        "2. docs/agent-workflow.md",
        "3. docs/contracts/contract-index.md",
        "4. docs/agent-memory/lessons-learned.md",
        "5. docs/agent-memory/regression-log.md",
        "6. docs/agent-memory/decisions.md",
        "7. docs/product-roadmap.md (when task touches product scope)",
        "",
        "Session state: docs/forge/session.md",
        "Branch naming: forge/dev-<id>-<slug>",
      ].join("\n");

    case "levrops":
      return [
        "Follow LevrOps feature-build conventions:",
        "",
        "1. Start with: ./scripts/feature_build.sh \"<feature description>\"",
        "   Or in Cursor: /feature_build <feature description>",
        "2. Feature spec is created at docs/features/<slug>.md",
        "3. Guardrails run automatically (contracts check, Django checks, tests)",
        "4. If the change affects DB schemas or API payloads, propose changes via levrops-contracts first — never edit generated artifacts directly",
        "5. Use /feature_refine if the spec needs clarification before implementation",
        "6. Complete with /feature_implement and verification per docs/WORKFLOW.md",
      ].join("\n");

    case "heirloom":
      return [
        "Use the generic feature-build workflow:",
        "",
        "1. Create a feature branch from the suggested branch name",
        "2. Write a brief feature spec before coding",
        "3. Implement with focused scope — no unrelated changes",
        "4. Add tests for meaningful behavior",
        "5. Verify locally before marking shipped in DevAnvil",
      ].join("\n");

    default:
      return [
        "Use the generic feature-build workflow:",
        "",
        "1. Create a feature branch from the suggested branch name",
        "2. Write a brief feature spec before coding",
        "3. Implement with focused scope",
        "4. Verify locally before marking shipped in DevAnvil",
      ].join("\n");
  }
}

function formatMatches(
  matches: Awaited<ReturnType<typeof getItem>>["matches"],
): string {
  if (matches.length === 0) {
    return "None detected.";
  }

  return matches
    .map(
      (match) =>
        `- [${match.status}] ${match.title} (${match.project}, score ${match.similarityScore.toFixed(2)}): ${match.matchReason}`,
    )
    .join("\n");
}

export async function generateFeaturePrompt(
  input: GenerateFeaturePromptInput,
): Promise<string> {
  const detail = await getItem({ itemId: input.itemId });
  const projectSlug = input.projectSlug ?? detail.project.slug;
  const repo = input.repo ?? projectSlug;
  const suggestedCommand =
    detail.suggestedCommand ??
    buildSuggestedCommand(
      detail.item.itemType,
      detail.item.title,
      projectSlug,
    );
  const suggestedBranch =
    detail.suggestedBranch ??
    `feature/${detail.item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}`;

  const lines = [
    suggestedCommand,
    "",
    "# DevAnvil Feature Build",
    "",
    `**DevAnvil Item ID:** ${detail.item.id}`,
    `**Project:** ${detail.project.name} (\`${projectSlug}\`)`,
    `**Target Repo:** ${repo}`,
    `**Title:** ${detail.item.title}`,
    `**Type:** ${detail.item.itemType}`,
    `**Status:** ${detail.item.status}`,
    "",
    "## Raw Idea",
    "",
    detail.rawText,
    "",
    "## Normalized Summary",
    "",
    detail.normalizedSummary,
    "",
    "## Related / Duplicate Matches",
    "",
    formatMatches(detail.matches),
    "",
    "## Suggested Branch",
    "",
    suggestedBranch,
    "",
    "## Suggested Command",
    "",
    suggestedCommand,
    "",
    "## Required Project Instructions",
    "",
    projectInstructions(projectSlug),
  ];

  if (input.includeContext) {
    if (detail.activity.length > 0) {
      lines.push("", "## Recent Activity", "");
      for (const entry of detail.activity.slice(0, 5)) {
        lines.push(
          `- ${entry.createdAt}: ${entry.action}${entry.note ? ` — ${entry.note}` : ""}`,
        );
      }
    }

    if (detail.builds.length > 0) {
      lines.push("", "## Linked Builds", "");
      for (const build of detail.builds) {
        lines.push(
          `- ${build.repo}@${build.branchName} (${build.status})`,
        );
      }
    }

    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
      select: { description: true },
    });

    if (project?.description) {
      lines.push("", "## Project Description", "", project.description);
    }
  }

  return lines.join("\n");
}

export async function generateFeaturePromptResult(
  input: GenerateFeaturePromptInput,
) {
  const item = await prisma.devItem.findUnique({
    where: { id: input.itemId },
    select: { id: true },
  });
  assertFound(item, `Item not found: ${input.itemId}`);

  const prompt = await generateFeaturePrompt(input);
  return { prompt };
}
