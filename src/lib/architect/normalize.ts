import type { ArchitectAnalysis, ArchitectAssumption } from "@/lib/architect/types";
import { mentalModelFromLegacyAnalysis, normalizeMentalModel } from "@/lib/architect/mental-model";

/** Upgrade legacy persisted analysis to v2 shape for UI + chat. */
export function normalizeArchitectAnalysis(
  raw: Record<string, unknown>,
  priorMessageCount = 0,
): ArchitectAnalysis {
  const analysis = raw as Partial<ArchitectAnalysis>;

  const intent = analysis.intent ?? "Architectural intent is still forming.";
  const problemStatement =
    analysis.problemStatement ?? "The gap in the system is not yet articulated.";
  const architecturalQuestions = analysis.architecturalQuestions ?? [];
  const architecturalRisks = analysis.architecturalRisks ?? [];
  const potentialConcepts = analysis.potentialConcepts ?? [];
  const suggestedInitiative = analysis.suggestedInitiative ?? {
    title: "Emerging Initiative",
    description: intent,
  };

  const currentUnderstanding =
    analysis.currentUnderstanding ??
    synthesizeUnderstanding(intent, problemStatement, potentialConcepts);

  const confidence =
    analysis.confidence ??
    estimateConfidence(priorMessageCount, potentialConcepts[0]?.confidence);

  const assumptions =
    analysis.assumptions ??
    inferAssumptions(analysis.nonGoals ?? [], architecturalQuestions);

  const decisionsLocked =
    analysis.decisionsLocked ??
    (analysis.nonGoals ?? [])
      .filter((n) => n.length < 80)
      .slice(0, 5)
      .map((n) => n.replace(/^Not\s+/i, "").trim() || n);

  const remainingUnknowns =
    analysis.remainingUnknowns ??
    architecturalQuestions.filter(
      (q) => !isGenericInterviewQuestion(q),
    );

  const strongOpinions =
    analysis.strongOpinions ??
    (analysis.recommendation ? [analysis.recommendation] : []);

  const architectMessage =
    analysis.architectMessage ??
    buildBeliefMessage(currentUnderstanding, confidence, remainingUnknowns);

  const mentalModel = normalizeMentalModel(
    analysis.mentalModel ?? mentalModelFromLegacyAnalysis(analysis, priorMessageCount),
  );

  return {
    mentalModel,
    currentUnderstanding,
    confidence,
    assumptions,
    decisionsLocked,
    remainingUnknowns,
    strongOpinions,
    intent,
    problemStatement,
    successCriteria: analysis.successCriteria ?? [],
    nonGoals: analysis.nonGoals ?? [],
    potentialConcepts,
    architecturalQuestions: remainingUnknowns.length > 0 ? remainingUnknowns : architecturalQuestions,
    affectedProductDomains: analysis.affectedProductDomains ?? [],
    affectedProtectedDomains: analysis.affectedProtectedDomains ?? [],
    suggestedInitiative,
    suggestedEpics: analysis.suggestedEpics ?? [],
    architecturalRisks,
    relatedMemory: analysis.relatedMemory ?? [],
    relatedInitiatives: analysis.relatedInitiatives ?? [],
    relatedRecords: analysis.relatedRecords ?? [],
    recommendation: analysis.recommendation ?? "",
    architectMessage,
  };
}

function synthesizeUnderstanding(
  intent: string,
  problem: string,
  concepts: { name: string; reasoning?: string }[],
): string {
  if (concepts[0]) {
    return `${intent} ${problem}`.trim();
  }
  return `${intent} ${problem}`.trim();
}

function estimateConfidence(
  priorMessageCount: number,
  conceptConfidence?: string,
): number {
  let base = 48;
  if (conceptConfidence === "high") base = 78;
  if (conceptConfidence === "medium") base = 62;
  if (conceptConfidence === "low") base = 52;
  return Math.min(96, base + Math.floor(priorMessageCount / 2) * 6);
}

function inferAssumptions(
  nonGoals: string[],
  questions: string[],
): ArchitectAssumption[] {
  const locked = nonGoals.slice(0, 3).map((text) => ({
    text,
    status: "locked" as const,
  }));
  const open = questions.slice(0, 3).map((text) => ({
    text,
    status: "open" as const,
  }));
  return [...locked, ...open];
}

function isGenericInterviewQuestion(q: string): boolean {
  const lower = q.toLowerCase();
  return (
    lower.includes("what are we building") ||
    lower.includes("what problem are we solving") ||
    lower.includes("what does success look like") ||
    lower.includes("help me understand")
  );
}

export function buildBeliefMessage(
  understanding: string,
  confidence: number,
  remainingUnknowns: string[],
): string {
  const summary = understanding.trim().split(/\n\n+/)[0] ?? understanding.slice(0, 320);

  let message = `Here is what I now believe:\n\n${summary}\n\nConfidence: ${confidence}%`;

  if (remainingUnknowns.length > 0) {
    message += `\n\nStill unresolved: ${remainingUnknowns[0]}`;
  }

  return message;
}

export function isEchoedCaptureTitle(
  title: string,
  captureText: string,
): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const t = normalize(title);
  const c = normalize(captureText);
  if (t.length < 8) return false;
  return c.includes(t) || t.includes(c.slice(0, Math.min(c.length, 60)));
}
