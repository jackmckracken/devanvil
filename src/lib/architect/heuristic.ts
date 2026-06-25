import type { ArchitectAnalysis } from "@/lib/architect/types";
import type { ArchitectContext } from "@/lib/architect/context";
import { inferProductDomains } from "@/lib/architect/context";
import { buildBeliefMessage } from "@/lib/architect/normalize";

function isCreativeInvestmentsInput(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    (/\bcreative\s+investment/i.test(lower) ||
      (/\binvestment/i.test(lower) &&
        /\b(learn|ableton|komplete|pedalboard|organize|studio|capability)\b/i.test(
          lower,
        ))) &&
    (/\bartist/i.test(lower) ||
      /\bnot\s+songs?\b/i.test(lower) ||
      /\bpractice\b/i.test(lower) ||
      /\bplace\s+to\s+capture\b/i.test(lower))
  );
}

export function heuristicArchitectAnalysis(
  text: string,
  context: ArchitectContext,
  priorMessageCount = 0,
): ArchitectAnalysis {
  if (isCreativeInvestmentsInput(text)) {
    return creativeInvestmentsAnalysis(context, priorMessageCount);
  }

  return genericArchitectAnalysis(text, context, priorMessageCount);
}

function creativeInvestmentsAnalysis(
  context: ArchitectContext,
  priorMessageCount: number,
): ArchitectAnalysis {
  const confidence = Math.min(94, 82 + Math.floor(priorMessageCount / 2) * 4);

  const currentUnderstanding = `I believe you're proposing a third orthogonal axis of artist development.

Creative Projects produce artifacts. Practice develops musicianship. Creative Investments develop artist capability over years — deliberate learning, experimentation, environment, and tooling choices that compound.

This is a distinct domain, not an extension of Practice and not a work-item backlog. Artists need a canonical place to capture and reflect on capability-building that is neither songs nor coaching sessions.`;

  const assumptions = [
    { text: "Practice alone is insufficient for long-horizon artist growth", status: "locked" as const },
    { text: "Capability — not output — is the tracked outcome", status: "locked" as const },
    { text: "Creative Investments influence Momentum", status: "open" as const },
    {
      text: "Creative Investments belong beside Practice, not inside it",
      status: "open" as const,
    },
    { text: "Completed investments become Architectural Memory via reflection", status: "open" as const },
  ];

  const decisionsLocked = [
    "Not songs",
    "Not Practice sessions",
    "Orthogonal to project output",
    "Capability-based, not task-based",
  ];

  const remainingUnknowns = [
    "Capability: unified model is appropriate until completed investment evidence accumulates.",
    "Momentum integration should follow evidence from completed investments — not speculation.",
    "Creative Investments boundary is emerging; Practice separation needs sustained evidence.",
  ];

  const strongOpinions = [
    "This belongs outside Practice — its own bounded context, not a Practice Coach feature.",
    "Treating this as work items would recreate Jira and violate the ontology.",
    "Workbench should not absorb another top-level destination without explicit navigation intent.",
    "Without reflection → memory, investments become a dead-end checklist.",
  ];

  const architecturalRisks = [
    "Overlaps Practice Coach if boundaries are not explicit",
    "Duplicates task-tracking patterns if conflated with DevItems",
    "Increases cognitive load — another surface artists must discover",
    "Unclear lifecycle from capture → active → completed → memory",
    "Momentum weighting could devalue shipping if capability dominates",
  ];

  const analysis: ArchitectAnalysis = {
    currentUnderstanding,
    confidence,
    assumptions,
    decisionsLocked,
    remainingUnknowns,
    strongOpinions,
    intent:
      "Help artists intentionally build creative capability over years — distinct from songs, practice, and project output.",
    problemStatement:
      "Artists lack a canonical place to capture learning, experimentation, and environment improvements. Practice develops musicianship. Projects produce artifacts. Nothing owns long-horizon capability growth.",
    successCriteria: [
      "Artists capture capability-building activities without project or task ceremony",
      "Completed investments surface in Architectural Memory",
      "Investments can link to initiatives without becoming work items",
      "Momentum recognizes capability growth alongside execution",
    ],
    nonGoals: [
      "Not songs or project deliverables",
      "Not replacing Practice Coach",
      "Not a task manager",
      "Not requiring every investment to ship a feature",
    ],
    potentialConcepts: [
      {
        name: "Creative Investments",
        confidence: "high",
        reasoning:
          "Language and ontology position this as a new object — a domain concept, not a feature ticket.",
      },
    ],
    architecturalQuestions: remainingUnknowns,
    affectedProductDomains: [
      "Workspace",
      "Momentum",
      "Memory",
      "Practice Coach",
      "Investments",
      "Dashboard",
    ],
    affectedProtectedDomains: context.protectedDomains,
    suggestedInitiative: {
      title: "Creative Investments",
      description:
        "Establish Creative Investments as a first-class domain for intentional artist capability development — orthogonal to Practice and Projects.",
      strategicValue: "future_vision",
    },
    suggestedEpics: [
      "Investment Model & Ontology",
      "Capture Experience",
      "Reflection & Memory",
      "Momentum Integration",
      "Recommendations",
    ],
    architecturalRisks,
    relatedMemory: context.memory,
    relatedInitiatives: context.relatedInitiatives,
    relatedRecords: context.records.map((r) => ({
      title: r.title,
      kind: r.kind,
      path: r.path,
    })),
    recommendation:
      "Lock the domain boundary first. Define the Creative Investments object model and its relationship to Practice, Momentum, and Memory before any Forge work.",
    architectMessage: "",
  };

  analysis.architectMessage = buildBeliefMessage(
    currentUnderstanding,
    confidence,
    remainingUnknowns,
  );

  return analysis;
}

function genericArchitectAnalysis(
  text: string,
  context: ArchitectContext,
  priorMessageCount: number,
): ArchitectAnalysis {
  const lower = text.toLowerCase();
  const productDomains = inferProductDomains(text);

  const isNewDomain =
    /\bnew\s+(domain|concept|object|subsystem)\b/i.test(text) ||
    (/\bnot\s+a\s+feature\b/i.test(text) && productDomains.length >= 2) ||
    /\borthogonal\b/i.test(text);

  const isFeature =
    !isNewDomain &&
    (/\b(add|build|implement|create)\b/i.test(lower) ||
      /\bshould\s+have\b/i.test(lower) ||
      /\busers?\s+need\b/i.test(lower));

  const conceptName = deriveConceptName(text, isNewDomain);
  const initiativeTitle = synthesizeInitiativeTitle(text, conceptName, isNewDomain, isFeature);

  const confidence = Math.min(
    92,
    (isNewDomain ? 74 : isFeature ? 58 : 50) + Math.floor(priorMessageCount / 2) * 5,
  );

  const currentUnderstanding = buildGenericUnderstanding(
    text,
    isNewDomain,
    isFeature,
    conceptName,
    productDomains,
    context,
  );

  const decisionsLocked = deriveDecisionsLocked(text, isNewDomain, isFeature);
  const assumptions = deriveAssumptions(text, isNewDomain, isFeature, productDomains);
  const remainingUnknowns = deriveRemainingUnknowns(text, productDomains, isNewDomain, isFeature);
  const strongOpinions = deriveStrongOpinions(
    text,
    isNewDomain,
    isFeature,
    conceptName,
    productDomains,
    context,
  );
  const architecturalRisks = deriveRisks(productDomains, context, isNewDomain, isFeature);

  const intent = deriveIntent(isNewDomain, isFeature, conceptName);
  const problemStatement = deriveProblem(isNewDomain, isFeature, conceptName);

  const analysis: ArchitectAnalysis = {
    currentUnderstanding,
    confidence,
    assumptions,
    decisionsLocked,
    remainingUnknowns,
    strongOpinions,
    intent,
    problemStatement,
    successCriteria: deriveSuccessCriteria(isNewDomain, isFeature),
    nonGoals: deriveNonGoals(isNewDomain, isFeature),
    potentialConcepts: conceptName
      ? [
          {
            name: conceptName,
            confidence: isNewDomain ? "high" : "medium",
            reasoning: isNewDomain
              ? "Signals point to a new domain or bounded context, not an incremental feature."
              : "Emerging concept — may be a subsystem evolution or scoped feature area.",
          },
        ]
      : [],
    architecturalQuestions: remainingUnknowns,
    affectedProductDomains: productDomains.length > 0 ? productDomains : ["Workspace"],
    affectedProtectedDomains: context.protectedDomains,
    suggestedInitiative: {
      title: initiativeTitle,
      description: intent,
      strategicValue: isNewDomain ? "future_vision" : "growth",
    },
    suggestedEpics: deriveEpics(isNewDomain, isFeature),
    architecturalRisks,
    relatedMemory: context.memory,
    relatedInitiatives: context.relatedInitiatives,
    relatedRecords: context.records.map((r) => ({
      title: r.title,
      kind: r.kind,
      path: r.path,
    })),
    recommendation: isNewDomain
      ? "Define the bounded context and ontology placement before implementation. This is architectural discovery."
      : isFeature
        ? "Scope narrowly. Verify domain ownership and protected-domain gates before Forge."
        : "Continue reducing uncertainty — lock boundaries before work items exist.",
    architectMessage: "",
  };

  analysis.architectMessage = buildBeliefMessage(
    currentUnderstanding,
    confidence,
    remainingUnknowns,
  );

  return analysis;
}

function synthesizeInitiativeTitle(
  text: string,
  conceptName: string | null,
  isNewDomain: boolean,
  isFeature: boolean,
): string {
  if (conceptName && !text.toLowerCase().includes(conceptName.toLowerCase().slice(0, 12))) {
    return conceptName;
  }
  if (conceptName) return conceptName;

  if (/\bbloom\b/i.test(text)) return "Bloom Interaction Quality";
  if (/\bworkbench\b/i.test(text)) return "Workbench Experience";
  if (/\bmomentum\b/i.test(text)) return "Momentum Evolution";
  if (/\bmemory\b/i.test(text)) return "Architectural Memory";
  if (/\brunway\b/i.test(text)) return "Runway Capability";
  if (isNewDomain) return "Emerging Domain";
  if (isFeature) return "Scoped Product Improvement";
  return "Architectural Discovery";
}

function buildGenericUnderstanding(
  text: string,
  isNewDomain: boolean,
  isFeature: boolean,
  conceptName: string | null,
  domains: string[],
  context: ArchitectContext,
): string {
  const domainNote =
    domains.length > 0
      ? `Primary surfaces: ${domains.slice(0, 4).join(", ")}.`
      : "Product surface is not yet pinned.";

  const protectedNote =
    context.protectedDomains.length > 0
      ? `This intersects governed subsystems (${context.protectedDomains.map((d) => d.domain.name).join(", ")}) — changes require evidence and contract alignment.`
      : "";

  if (isNewDomain && conceptName) {
    return `I believe you're introducing a new architectural concept — ${conceptName} — not a single feature. The capture signals a missing bounded context in the product model. ${domainNote} ${protectedNote}`.trim();
  }

  if (isFeature) {
    return `I believe this is a scoped product improvement with a clear user-facing gap, not a new domain. The change should stay narrow and respect existing architectural boundaries. ${domainNote} ${protectedNote}`.trim();
  }

  return `I believe the capture points to structural ambiguity — either a missing concept or a misaligned boundary between existing subsystems. ${domainNote} ${protectedNote} More exchange should lock whether this is evolution or a new root object.`.trim();
}

function deriveConceptName(text: string, isNewDomain: boolean): string | null {
  const quoted = text.match(/"([^"]+)"/)?.[1];
  if (quoted) return quoted;
  if (/\bcreative\s+investment/i.test(text)) return "Creative Investments";
  if (isNewDomain) {
    const title = text.split(/[.\n]/)[0]?.trim() ?? "";
    if (title.length > 60) return null;
    return null;
  }
  return null;
}

function deriveDecisionsLocked(
  text: string,
  isNewDomain: boolean,
  isFeature: boolean,
): string[] {
  const locked: string[] = [];
  if (/\bnot\s+a\s+feature\b/i.test(text)) locked.push("Not a single feature ticket");
  if (/\bnot\s+practice\b/i.test(text)) locked.push("Not Practice");
  if (/\bnot\s+songs?\b/i.test(text)) locked.push("Not songs");
  if (isNewDomain) locked.push("Requires ontology definition before Forge");
  if (isFeature) locked.push("Scoped UX/product change, not domain invention");
  if (locked.length === 0) locked.push("Capture warrants architectural review before build");
  return locked;
}

function deriveAssumptions(
  text: string,
  isNewDomain: boolean,
  isFeature: boolean,
  domains: string[],
): ArchitectAnalysis["assumptions"] {
  const assumptions: ArchitectAnalysis["assumptions"] = [];

  if (/\bartist/i.test(text)) {
    assumptions.push({
      text: "Primary beneficiary is the artist, not the builder",
      status: "locked",
    });
  }

  if (isNewDomain) {
    assumptions.push({
      text: "Existing subsystems cannot absorb this without boundary blur",
      status: "locked",
    });
  }

  if (isFeature) {
    assumptions.push({
      text: "A bounded implementation can satisfy the need without new ontology",
      status: "open",
    });
  }

  if (domains.includes("Practice Coach")) {
    assumptions.push({
      text: "This may belong inside Practice rather than a new surface",
      status: "open",
    });
  }

  if (/\bmomentum\b/i.test(text)) {
    assumptions.push({
      text: "Momentum semantics will need to account for this change",
      status: "open",
    });
  }

  if (assumptions.length < 2) {
    assumptions.push({
      text: "The capture contains enough signal to reason about — not a blank slate",
      status: "locked",
    });
  }

  return assumptions;
}

function deriveRemainingUnknowns(
  text: string,
  domains: string[],
  isNewDomain: boolean,
  isFeature: boolean,
): string[] {
  const observations: string[] = [];

  if (isNewDomain) {
    observations.push(
      "Ontology placement should emerge from evidence — not be invented in conversation.",
    );
  }

  if (domains.includes("Practice Coach")) {
    observations.push(
      "Practice boundary pressure will rise only if repeated evidence shows overlap.",
    );
  }

  if (/\bmomentum\b/i.test(text)) {
    observations.push(
      "Momentum linkage pressure depends on completed work and investment evidence.",
    );
  }

  if (isFeature && observations.length < 2) {
    observations.push(
      "Ship the smallest slice first — let evidence validate domain ownership.",
    );
  }

  return observations.slice(0, 4);
}

function deriveStrongOpinions(
  text: string,
  isNewDomain: boolean,
  isFeature: boolean,
  conceptName: string | null,
  domains: string[],
  context: ArchitectContext,
): string[] {
  const opinions: string[] = [];

  if (isNewDomain && conceptName) {
    opinions.push(`I believe ${conceptName} should become its own bounded context.`);
  } else if (isNewDomain) {
    opinions.push("I believe this should not ship as a feature ticket — ontology first.");
  }

  if (isFeature) {
    opinions.push("I believe this can ship as a narrow change if domain gates are satisfied.");
  }

  if (domains.length > 3) {
    opinions.push("I think the blast radius is too wide for a single work item.");
  }

  if (context.protectedDomains.length > 0) {
    opinions.push(
      `I think governance on ${context.protectedDomains.map((d) => d.domain.name).join(", ")} will dominate implementation cost.`,
    );
  }

  if (/\bworkbench\b/i.test(text) && isNewDomain) {
    opinions.push("I think Workbench complexity increases if this adds another top-level lane.");
  }

  if (opinions.length === 0) {
    opinions.push("I think we should lock architectural boundaries before writing code.");
  }

  return opinions;
}

function deriveIntent(isNewDomain: boolean, isFeature: boolean, conceptName: string | null): string {
  if (isNewDomain && conceptName) {
    return `Establish ${conceptName} as a durable architectural concept that preserves intent across implementations.`;
  }
  if (isNewDomain) return "Introduce a new bounded context with explicit ontology placement.";
  if (isFeature) return "Close a specific product gap without violating architectural boundaries.";
  return "Reduce structural ambiguity before implementation.";
}

function deriveProblem(
  isNewDomain: boolean,
  isFeature: boolean,
  conceptName: string | null,
): string {
  if (isNewDomain) {
    return conceptName
      ? `The product lacks a canonical model for ${conceptName}. Without it, builders will optimize locally and blur boundaries.`
      : "The system lacks a canonical place for this concept.";
  }
  if (isFeature) return "Users lack an intentional experience for this need within existing surfaces.";
  return "Architectural boundaries are unclear — risk of wrong subsystem ownership.";
}

function deriveSuccessCriteria(isNewDomain: boolean, isFeature: boolean): string[] {
  if (isNewDomain) {
    return [
      "Ontology placement is explicit with non-goals",
      "Initiative groups future work without premature implementation",
      "Intent survives in Architectural Memory",
    ];
  }
  if (isFeature) {
    return [
      "User need met in the smallest defensible scope",
      "Protected-domain evidence satisfied if applicable",
    ];
  }
  return ["Boundaries locked before work items exist"];
}

function deriveNonGoals(isNewDomain: boolean, isFeature: boolean): string[] {
  const base = ["Work items before architectural clarity"];
  if (isNewDomain) base.push("Treating a domain as a single feature");
  if (isFeature) base.push("Expanding into ontology changes without cause");
  return base;
}

function deriveEpics(isNewDomain: boolean, isFeature: boolean): string[] {
  if (isNewDomain) {
    return ["Concept & Ontology", "Capture Experience", "Integration Points", "Memory & Reflection"];
  }
  if (isFeature) {
    return ["Experience Design", "Implementation", "Verification"];
  }
  return ["Boundary Definition", "Domain Mapping", "Initiative Shaping"];
}

function deriveRisks(
  domains: string[],
  context: ArchitectContext,
  isNewDomain: boolean,
  isFeature: boolean,
): string[] {
  const risks: string[] = [];
  if (isNewDomain) risks.push("Premature implementation before concept is defined");
  if (isFeature) risks.push("Scope creep into adjacent subsystems");
  if (context.protectedDomains.length > 0) {
    risks.push(
      `Governed subsystems: ${context.protectedDomains.map((d) => d.domain.name).join(", ")}`,
    );
  }
  if (domains.length > 3) risks.push("Wide blast radius across product domains");
  risks.push("Increases cognitive load if surfaced without clear navigation intent");
  if (risks.length === 1) risks.push("Wrong subsystem ownership if boundaries stay fuzzy");
  return risks;
}
