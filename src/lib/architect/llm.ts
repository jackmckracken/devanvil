import type { ArchitectAnalysis } from "@/lib/architect/types";
import type { ArchitectContext } from "@/lib/architect/context";
import { buildModelDeltaMessage } from "@/lib/architect/mental-model";
import { pressuresToBeliefs } from "@/lib/architect/present";
import type { ArchitectMentalModel } from "@/lib/architect/mental-model-types";

const SYSTEM_PROMPT = `You are DevAnvil Architect v4 — a cognitive workspace where architecture gradually becomes visible.

Primary design principle: reduce uncertainty, not display information.

The model is the primary artifact. Conversation only improves the model.

Architect does NOT ask "what should the model be?" — it asks "what is reality trying to become?"

Return strict JSON with:
mentalModel: {
  version: 3,
  rootId, nodes, relationships, options, recommendedOptionId, changes, pressures
}
intent, problemStatement, successCriteria, nonGoals, potentialConcepts,
suggestedInitiative ({title - SYNTHESIZED not echoed capture, description, strategicValue}),
suggestedEpics, architecturalRisks, recommendation,
architectMessage (living language — boundary settled, relationship strengthened, NOT percentages)

RULES:
- NEVER surface raw confidence or pressure percentages to the user in architectMessage
- Use belief language: "Evidence is accumulating, but reality has not yet earned a split."
- NEVER suggest taxonomy splits without earned evidence
- Pressure accumulates from completed work, investments, captures — NOT user suggestions
- Hide settled/stable architecture — highlight only what still needs thinking
- Competing options only when genuinely contested
- Initiative title must be synthesized product name
- architectMessage should make the user think "I understand this better now" not "I have more data"`;

export async function llmArchitectAnalysis(
  text: string,
  context: ArchitectContext,
  priorMessages: { role: string; content: string }[],
): Promise<(import("@/lib/architect/types").ArchitectAnalysis) | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const userPayload = {
    idea: text,
    exchangeCount: priorMessages.filter((m) => m.role === "user").length,
    relatedMemory: context.memory.slice(0, 5).map((m) => m.title),
    relatedInitiatives: context.relatedInitiatives.map((i) => i.title),
    protectedDomains: context.protectedDomains.map((d) => d.domain.name),
    evidence: context.evidence,
    priorConversation: priorMessages.slice(-8),
  };

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(userPayload) },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as import("@/lib/architect/types").ArchitectAnalysis & {
      mentalModel: ArchitectMentalModel;
    };

    return {
      ...parsed,
      mentalModel: parsed.mentalModel,
      affectedProtectedDomains: context.protectedDomains,
      relatedMemory: context.memory,
      relatedInitiatives: context.relatedInitiatives,
      relatedRecords: context.records.map((r) => ({
        title: r.title,
        kind: r.kind,
        path: r.path,
      })),
      architectMessage:
        parsed.architectMessage ??
        (parsed.mentalModel ? buildModelDeltaMessage(parsed.mentalModel) : ""),
      confidence: parsed.mentalModel?.nodes?.[1]?.confidence ?? 70,
      currentUnderstanding: "",
      assumptions: [],
      decisionsLocked: [],
      remainingUnknowns: parsed.mentalModel?.pressures
        ? pressuresToBeliefs(parsed.mentalModel.pressures)
        : [],
      strongOpinions: [],
      architecturalQuestions: [],
    };
  } catch {
    return null;
  }
}
