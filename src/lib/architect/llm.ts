import type { ArchitectAnalysis } from "@/lib/architect/types";
import type { ArchitectContext } from "@/lib/architect/context";
import { buildModelDeltaMessage } from "@/lib/architect/mental-model";
import type { ArchitectMentalModel } from "@/lib/architect/mental-model-types";

const SYSTEM_PROMPT = `You are DevAnvil Architect v3 — you externalize architectural thought as a MENTAL MODEL.

The model is the primary artifact. The conversation only improves the model.

Architect does NOT ask "what should the model be?" — it asks "what is reality trying to become?"

Return strict JSON with:
mentalModel: {
  version: 3,
  rootId: string,
  nodes: [{ id, label, kind, parentId, annotation?, confidence 0-100, assumptions: [{text, status: locked|open}], state: existing|proposed|uncertain|locked }],
  relationships: [{ id, fromLabel, toLabel, label, confidence }],
  options: [{ id, label, preview (ascii tree), confidence, reason }],
  recommendedOptionId: string | null,
  changes: [{ type: new_node|boundary_moved|new_relationship|node_split|assumption_locked, summary }],
  pressures: [{ nodeId, nodeLabel, kind: specialize|merge|subtypes|reference_link|boundary_shift, label, level 0-100, status, evidence: [{label, count}], recommendation: stable|observe|prepare|split, recommendationDetail }]
}
intent, problemStatement, successCriteria, nonGoals, potentialConcepts,
suggestedInitiative ({title - SYNTHESIZED not echoed capture, description, strategicValue}),
suggestedEpics, architecturalRisks, recommendation,
architectMessage (brief model delta only — NOT paragraphs)

RULES:
- NEVER suggest taxonomy splits or ontology inventions as questions
- NEVER ask "Should X split into Y/Z?" — show architectural pressure from evidence instead
- Pressure accumulates from completed work, investments, captures, regressions — NOT user suggestions
- node_split changes ONLY when pressure recommendation is "split" with earned evidence
- Recommendations: stable (keep unified), observe (pattern emerging), prepare (likely future), split (reality justifies evolution)
- Confidence attaches to nodes and relationships, not one session score
- Present competing options with confidence percentages when genuinely unresolved
- Expose assumptions on nodes visually (locked vs open)
- Every turn should list changes[] showing what evolved
- NEVER ask "what are we building" if user gave intent
- Initiative title must be synthesized product name
- Architect should sound like an experienced architect: "I see the pressure. We haven't earned this abstraction yet."`;

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
      remainingUnknowns: parsed.mentalModel?.pressures?.map((p) => p.recommendationDetail) ?? [],
      strongOpinions: [],
      architecturalQuestions: [],
    };
  } catch {
    return null;
  }
}
