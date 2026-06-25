import { gatherArchitectContext } from "@/lib/architect/context";
import { heuristicArchitectAnalysis } from "@/lib/architect/heuristic";
import { llmArchitectAnalysis } from "@/lib/architect/llm";
import {
  buildInitiativeFromModel,
  buildMentalModelFromText,
  mentalModelFromLegacyAnalysis,
  syncAnalysisFromModel,
} from "@/lib/architect/mental-model";
import type { ArchitectMentalModel } from "@/lib/architect/mental-model-types";
import {
  isEchoedCaptureTitle,
  normalizeArchitectAnalysis,
} from "@/lib/architect/normalize";
import type { ArchitectAnalysis, ArchitectMessage } from "@/lib/architect/types";

export async function runArchitectAnalysis(
  text: string,
  projectSlug: string,
  priorMessages: ArchitectMessage[] = [],
  originalCapture?: string,
  priorModel?: ArchitectMentalModel | null,
): Promise<ArchitectAnalysis> {
  const context = await gatherArchitectContext(text, projectSlug);
  const userMessageCount = priorMessages.filter((m) => m.role === "user").length;
  const lastUser = [...priorMessages].reverse().find((m) => m.role === "user");

  const llmMessages = priorMessages.map((m) => ({
    role: m.role === "architect" ? "assistant" : "user",
    content: m.content,
  }));

  const llmResult = await llmArchitectAnalysis(text, context, llmMessages);
  const raw = llmResult ?? heuristicArchitectAnalysis(text, context, userMessageCount);

  let analysis = normalizeArchitectAnalysis(
    raw as unknown as Record<string, unknown>,
    userMessageCount,
  );

  const model = buildMentalModelFromText(
    text,
    context,
    userMessageCount,
    priorModel ?? analysis.mentalModel ?? null,
    lastUser?.content,
  );

  if (!analysis.mentalModel) {
    analysis.mentalModel = mentalModelFromLegacyAnalysis(analysis, userMessageCount);
  }

  analysis = syncAnalysisFromModel(analysis, model);
  analysis.mentalModel = model;

  if (
    originalCapture &&
    isEchoedCaptureTitle(analysis.suggestedInitiative.title, originalCapture)
  ) {
    const concept = analysis.potentialConcepts[0]?.name;
    if (concept) {
      analysis.suggestedInitiative.title = concept;
    }
  }

  return analysis;
}

export function buildInitiativeDescription(analysis: ArchitectAnalysis): string {
  if (analysis.mentalModel) {
    return buildInitiativeFromModel(analysis);
  }

  return [
    "## Intent",
    analysis.intent,
    "",
    analysis.problemStatement,
  ].join("\n");
}
