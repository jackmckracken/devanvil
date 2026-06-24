import type { ItemType } from "@/generated/prisma/client";
import type { Project } from "@/generated/prisma/client";
import {
  buildBranchName,
  buildSuggestedCommand,
  extractSummary,
  extractTitle,
} from "@/lib/text";

export type ClassifierInput = {
  text: string;
  sourceType: string;
  projectHint?: string;
  projects: Pick<Project, "id" | "name" | "slug" | "description">[];
};

export type ClassifierOutput = {
  projectSlug: string;
  itemType: ItemType;
  title: string;
  summary: string;
  suggestedBranchName: string;
  suggestedCommand: string;
  confidenceScore: number;
};

const PROJECT_KEYWORDS: Record<string, string[]> = {
  studioops: ["studioops", "studio ops", "practice", "coach", "music studio"],
  levrops: ["levrops", "levr ops", "tenant", "crm", "ops platform"],
  heirloom: ["heirloom", "family", "legacy", "archive"],
  "hewn-ventures": ["hewn", "ventures", "investment", "portfolio"],
};

const TYPE_KEYWORDS: Record<ItemType, string[]> = {
  bug: ["bug", "broken", "error", "crash", "fails", "not working"],
  regression: ["regression", "used to work", "stopped working", "broke again"],
  feature: ["feature", "add", "build", "implement", "new"],
  decision: ["decide", "decision", "should we", "tradeoff", "choose"],
  question: ["question", "how do", "what if", "why", "?"],
  chore: ["chore", "cleanup", "refactor", "rename", "update deps"],
  opportunity: ["opportunity", "idea", "could", "might", "explore"],
};

function scoreProjectMatch(
  text: string,
  slug: string,
  hint?: string,
): number {
  const lower = text.toLowerCase();
  let score = 0;

  if (hint && slug === hint.toLowerCase()) score += 5;
  if (lower.includes(slug.replace(/-/g, " ")) || lower.includes(slug)) {
    score += 3;
  }

  for (const keyword of PROJECT_KEYWORDS[slug] ?? []) {
    if (lower.includes(keyword)) score += 1;
  }

  return score;
}

function detectItemType(text: string): ItemType {
  const lower = text.toLowerCase();
  let best: ItemType = "feature";
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS) as [
    ItemType,
    string[],
  ][]) {
    const score = keywords.reduce(
      (acc, keyword) => acc + (lower.includes(keyword) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }

  return best;
}

function heuristicClassify(input: ClassifierInput): ClassifierOutput {
  const hint = input.projectHint?.toLowerCase().trim();
  let bestProject = input.projects[0];
  let bestScore = -1;

  for (const project of input.projects) {
    const score = scoreProjectMatch(input.text, project.slug, hint);
    if (score > bestScore) {
      bestScore = score;
      bestProject = project;
    }
  }

  const itemType = detectItemType(input.text);
  const title = extractTitle(input.text);
  const summary = extractSummary(input.text);
  const suggestedBranchName = buildBranchName(itemType, title);
  const suggestedCommand = buildSuggestedCommand(
    itemType,
    title,
    bestProject.slug,
  );

  return {
    projectSlug: bestProject.slug,
    itemType,
    title,
    summary,
    suggestedBranchName,
    suggestedCommand,
    confidenceScore: bestScore > 0 ? Math.min(0.95, 0.55 + bestScore * 0.08) : 0.5,
  };
}

async function llmClassify(input: ClassifierInput): Promise<ClassifierOutput | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const projectList = input.projects
    .map((p) => `${p.slug} (${p.name})`)
    .join(", ");

  const systemPrompt = `You classify dev ideas for DevAnvil. Return strict JSON only with keys:
projectSlug, itemType, title, summary, suggestedBranchName, suggestedCommand, confidenceScore.
Valid projectSlug values: ${projectList}
Valid itemType values: feature, bug, regression, decision, question, chore, opportunity`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify({
            text: input.text,
            sourceType: input.sourceType,
            projectHint: input.projectHint ?? null,
          }),
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as ClassifierOutput;
    const validProject = input.projects.find((p) => p.slug === parsed.projectSlug);
    if (!validProject) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function classifyIntake(
  input: ClassifierInput,
): Promise<ClassifierOutput> {
  try {
    const llmResult = await llmClassify(input);
    if (llmResult) return llmResult;
  } catch {
    // Fall back to heuristics when LLM is unavailable.
  }

  return heuristicClassify(input);
}
