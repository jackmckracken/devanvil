import type { ArchitectContext } from "@/lib/architect/context";
import type { ArchitectEvidence } from "@/lib/architect/evidence-types";
import {
  computeNodePressures,
  demoEvidenceForExchange,
  mergeEvidence,
  recommendationFromLevel,
} from "@/lib/architect/pressure";
import {
  architectBeliefForPressure,
  changeToLivingLanguage,
  formatEvidenceBrief,
  isArchitectureContested,
  modelDeltaMessage,
  pressuresNeedingAttention,
  pressuresToBeliefs,
  relationshipBelief,
} from "@/lib/architect/present";
import type { ArchitectAnalysis } from "@/lib/architect/types";
import type {
  ArchitectMentalModel,
  ModelChange,
  ModelNode,
  ModelRelationship,
} from "@/lib/architect/mental-model-types";

export function normalizeMentalModel(
  model: Partial<ArchitectMentalModel> | null | undefined,
): ArchitectMentalModel {
  return {
    version: 3,
    rootId: model?.rootId ?? "root",
    nodes: model?.nodes ?? [],
    relationships: model?.relationships ?? [],
    options: model?.options ?? [],
    recommendedOptionId: model?.recommendedOptionId ?? null,
    changes: model?.changes ?? [],
    pressures: Array.isArray(model?.pressures) ? model.pressures : [],
  };
}

function nid(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function node(
  label: string,
  opts: Partial<ModelNode> & { kind: ModelNode["kind"]; parentId: string | null },
): ModelNode {
  return {
    id: opts.id ?? nid(label),
    label,
    annotation: opts.annotation,
    confidence: opts.confidence ?? 70,
    assumptions: opts.assumptions ?? [],
    state: opts.state ?? "existing",
    ...opts,
  };
}

function rel(fromLabel: string, toLabel: string, label: string, confidence: number): ModelRelationship {
  return {
    id: `${nid(fromLabel)}_${nid(toLabel)}_${nid(label)}`,
    fromLabel,
    toLabel,
    label,
    confidence,
  };
}

export function buildCreativeInvestmentsModel(
  exchangeCount: number,
  evidence: ArchitectEvidence,
): ArchitectMentalModel {
  const root = node("Artist", { kind: "root", parentId: null, confidence: 95, state: "existing" });

  if (exchangeCount === 0) {
    const nodes: ModelNode[] = [
      root,
      node("Creative Projects", {
        kind: "domain",
        parentId: root.id,
        annotation: "produces artifacts",
        confidence: 94,
        state: "existing",
      }),
      node("Practice", {
        kind: "domain",
        parentId: root.id,
        annotation: "develops musicianship",
        confidence: 91,
        state: "existing",
        assumptions: [{ text: "Repetition only", status: "open" }],
      }),
      node("Creative Investments", {
        kind: "concept",
        parentId: root.id,
        annotation: "develops capability",
        confidence: 92,
        state: "proposed",
        assumptions: [
          { text: "Separate domain", status: "open" },
          { text: "Not inside Practice", status: "open" },
        ],
      }),
      node("Capability", {
        kind: "capability",
        parentId: root.id,
        confidence: 43,
        state: "uncertain",
      }),
    ];

    const pressures = computeNodePressures(nodes, evidence, {
      practiceBoundaryLocked: false,
    });

    return {
      version: 3,
      rootId: root.id,
      nodes,
      relationships: [
        rel("Practice", "musicianship", "improves", 88),
        rel("Creative Investments", "capability", "expands", 92),
        rel("Capability", "creative potential", "increases", 43),
        rel("Creative Projects", "capability", "consumes", 70),
      ],
      options: [
        {
          id: "opt_a",
          label: "Option A — Inside Practice",
          preview: "Practice\n    └── Investments",
          confidence: 72,
          reason: "Fewer surfaces, but blurs musicianship vs capability growth.",
        },
        {
          id: "opt_b",
          label: "Option B — Standalone Domain",
          preview: "Creative Investments\n    (standalone)",
          confidence: 91,
          reason: "Keeps capability orthogonal to musicianship.",
        },
      ],
      recommendedOptionId: "opt_b",
      changes: [{ type: "new_node", summary: "Creative Investments" }],
      pressures,
    };
  }

  const nodes: ModelNode[] = [
    root,
    node("Signal", { kind: "subsystem", parentId: root.id, confidence: 90, state: "existing" }),
    node("Workbench", { kind: "subsystem", parentId: root.id, confidence: 88, state: "existing" }),
    node("Practice", {
      kind: "domain",
      parentId: root.id,
      annotation: "repetition only",
      confidence: 88,
      state: "locked",
      assumptions: [{ text: "Repetition only", status: "locked" }],
    }),
    node("Creative Investments", {
      kind: "concept",
      parentId: root.id,
      annotation: "develops capability",
      confidence: Math.min(96, 92 + exchangeCount * 2),
      state: "proposed",
      assumptions: [{ text: "Separate domain", status: "locked" }],
    }),
    node("Runway", { kind: "subsystem", parentId: root.id, confidence: 85, state: "existing" }),
    node("Momentum", {
      kind: "subsystem",
      parentId: root.id,
      confidence: exchangeCount > 1 ? 78 : 54,
      state: "uncertain",
    }),
    node("Capability", {
      kind: "capability",
      parentId: root.id,
      confidence: 43,
      state: "uncertain",
    }),
  ];

  const changes: ModelChange[] = [
    { type: "boundary_moved", summary: "Practice — now owns repetition only" },
  ];

  if (exchangeCount > 1) {
    changes.push({
      type: "new_relationship",
      summary: "Momentum → rewards completed investments",
    });
  }

  const momentumLinked = exchangeCount > 1;
  const capabilityPressure = computeNodePressures(
    nodes,
    evidence,
    { momentumLinked, practiceBoundaryLocked: true },
  ).find((p) => p.nodeLabel === "Capability");

  if (
    capabilityPressure &&
    recommendationFromLevel(capabilityPressure.level) === "split"
  ) {
    changes.push({
      type: "node_split",
      summary: "Capability families — earned by completed investment evidence",
    });
  }

  const pressures = computeNodePressures(nodes, evidence, {
    momentumLinked,
    practiceBoundaryLocked: true,
  });

  return {
    version: 3,
    rootId: root.id,
    nodes,
    relationships: [
      rel("Practice", "musicianship", "improves", 88),
      rel("Creative Investments", "capability", "expands", 94),
      rel("Capability", "creative potential", "increases", capabilityPressure?.level ?? 43),
      rel("Creative Projects", "capability", "consumes", 72),
      rel("Momentum", "completed investments", "rewards", exchangeCount > 1 ? 78 : 54),
    ],
    options: [
      {
        id: "opt_a",
        label: "Option A — Inside Practice",
        preview: "Practice\n    └── Investments",
        confidence: 68,
        reason: "Rejected — blurs capability with musicianship.",
      },
      {
        id: "opt_b",
        label: "Option B — Standalone Domain",
        preview: "Creative Investments",
        confidence: Math.min(96, 91 + exchangeCount),
        reason: "Keeps capability orthogonal to musicianship.",
      },
    ],
    recommendedOptionId: "opt_b",
    changes,
    pressures,
  };
}

export function buildGenericMentalModel(
  text: string,
  context: ArchitectContext,
  exchangeCount: number,
): ArchitectMentalModel {
  const rootLabel = /\bartist/i.test(text) ? "Artist" : "System";
  const root = node(rootLabel, { kind: "root", parentId: null, confidence: 80 });

  const domains = context.protectedDomains.map((d) => d.domain.name);
  const productHints = [
    /\bbloom\b/i.test(text) && "Bloom",
    /\bworkbench\b/i.test(text) && "Workbench",
    /\bmomentum\b/i.test(text) && "Momentum",
    /\brunway\b/i.test(text) && "Runway",
  ].filter(Boolean) as string[];

  const childLabels = [...new Set([...productHints, ...domains.slice(0, 3)])];
  if (childLabels.length === 0) childLabels.push("Emerging Concept");

  const proposed = /\bnew\b/i.test(text) || /\bneed\b/i.test(text);
  const focal = childLabels[childLabels.length - 1] ?? "Change Area";

  const nodes: ModelNode[] = [
    root,
    ...childLabels.map((label, i) =>
      node(label, {
        kind: "domain",
        parentId: root.id,
        confidence: 55 + i * 8 + exchangeCount * 4,
        state: label === focal && proposed ? "proposed" : "existing",
        assumptions:
          label === focal && proposed
            ? [{ text: "Boundary placement unresolved", status: "open" }]
            : [],
      }),
    ),
  ];

  if (proposed && !childLabels.includes(focal)) {
    nodes.push(
      node(focal, {
        kind: "concept",
        parentId: root.id,
        confidence: 58 + exchangeCount * 5,
        state: "proposed",
      }),
    );
  }

  const pressures = computeNodePressures(nodes, context.evidence, {
    momentumLinked: false,
  });

  return {
    version: 3,
    rootId: root.id,
    nodes,
    relationships: [
      rel(focal, rootLabel, "extends", 52 + exchangeCount * 6),
      rel(rootLabel, "intent", "preserves", 70),
    ],
    options: proposed
      ? [
          {
            id: "opt_embed",
            label: "Option A — Embed in existing domain",
            preview: `${childLabels[0] ?? "Domain"}\n    └── extension`,
            confidence: 58,
            reason: "Lower surface area, higher coupling risk.",
          },
          {
            id: "opt_standalone",
            label: "Option B — Standalone bounded context",
            preview: focal,
            confidence: 64 + exchangeCount * 4,
            reason: "Clearer boundaries, more navigation cost.",
          },
        ]
      : [],
    recommendedOptionId: proposed ? "opt_standalone" : null,
    changes: proposed ? [{ type: "new_node", summary: focal }] : [],
    pressures,
  };
}

export function evolveMentalModel(
  prior: ArchitectMentalModel,
  userReply: string,
  exchangeCount: number,
  evidence: ArchitectEvidence,
): ArchitectMentalModel {
  const lower = userReply.toLowerCase();
  const model = structuredClone(prior);
  const changes: ModelChange[] = [];

  if (/\bmomentum\b/i.test(lower) && /\byes\b/i.test(lower)) {
    const momentum = model.nodes.find((n) => n.label === "Momentum");
    if (momentum) {
      momentum.confidence = Math.min(96, momentum.confidence + 24);
      momentum.state = "locked";
    }
    const rel = model.relationships.find((r) => r.fromLabel === "Momentum");
    if (rel) rel.confidence = Math.min(96, rel.confidence + 24);
    changes.push({
      type: "new_relationship",
      summary: "Momentum rewards completed investments",
    });
    model.pressures = (model.pressures ?? []).filter((p) => p.nodeLabel !== "Momentum");
  }

  if (/\bpractice\b/i.test(lower) && /\b(separate|outside|not inside)\b/i.test(lower)) {
    const practice = model.nodes.find((n) => n.label === "Practice");
    if (practice) {
      practice.annotation = "repetition only";
      practice.state = "locked";
      practice.confidence = Math.min(96, practice.confidence + 6);
      practice.assumptions = [{ text: "Repetition only", status: "locked" }];
    }
    const ci = model.nodes.find((n) => n.label === "Creative Investments");
    if (ci) {
      ci.assumptions = [{ text: "Separate domain", status: "locked" }];
      ci.confidence = Math.min(96, ci.confidence + 4);
    }
    changes.push({ type: "boundary_moved", summary: "Practice — repetition only" });
    model.pressures = (model.pressures ?? []).filter((p) => p.nodeLabel !== "Practice");
  }

  // User suggestions alone do not earn ontology splits — only evidence does.
  if (/\b(completed|shipped|finished)\b/i.test(lower) && /\binvestment/i.test(lower)) {
    const cap = model.nodes.find((n) => n.label === "Capability");
    if (cap) cap.confidence = Math.min(96, cap.confidence + 4);
  }

  if (changes.length > 0) {
    model.changes = changes;
  }

  if (exchangeCount >= 2 && model.nodes.some((n) => n.label === "Creative Investments")) {
    return buildCreativeInvestmentsModel(exchangeCount, evidence);
  }

  model.pressures = computeNodePressures(model.nodes, evidence, {
    momentumLinked: model.nodes.some((n) => n.label === "Momentum" && n.state === "locked"),
    practiceBoundaryLocked: model.nodes.some((n) => n.label === "Practice" && n.state === "locked"),
  });

  return model;
}

export function modelOverallConfidence(model: ArchitectMentalModel): number {
  const focal = model.nodes.filter(
    (n) => n.state === "proposed" || n.kind === "concept" || n.parentId === model.rootId,
  );
  if (focal.length === 0) return 50;
  return Math.round(
    focal.reduce((sum, n) => sum + n.confidence, 0) / focal.length,
  );
}

export function buildModelDeltaMessage(model: ArchitectMentalModel): string {
  return modelDeltaMessage(model);
}

export function renderModelTreeAscii(model: ArchitectMentalModel): string {
  const lines: string[] = [];
  const root = model.nodes.find((n) => n.id === model.rootId);
  if (!root) return "";

  lines.push(root.label);

  function walk(parentId: string, prefix: string) {
    const children = model.nodes.filter((n) => n.parentId === parentId);
    children.forEach((child, i) => {
      const isLast = i === children.length - 1;
      const branch = isLast ? "└── " : "├── ";
      const annotation = child.annotation ? `\n${prefix}${isLast ? "    " : "│   "}   ${child.annotation}` : "";
      const conf = ` (${child.confidence}%)`;
      lines.push(`${prefix}${branch}${child.label}${conf}${annotation}`);
      walk(child.id, `${prefix}${isLast ? "    " : "│   "}`);
    });
  }

  walk(root.id, "");
  return lines.join("\n");
}

export function buildMentalModelFromText(
  text: string,
  context: ArchitectContext,
  exchangeCount: number,
  prior?: ArchitectMentalModel | null,
  lastReply?: string,
): ArchitectMentalModel {
  const isCI =
    /\bcreative\s+investment/i.test(text) ||
    (/\binvestment/i.test(text) && /\bartist/i.test(text) && /\bpractice\b/i.test(text));

  const evidence = isCI
    ? mergeEvidence(context.evidence, demoEvidenceForExchange(exchangeCount))
    : context.evidence;

  let model = isCI
    ? buildCreativeInvestmentsModel(exchangeCount, evidence)
    : buildGenericMentalModel(text, context, exchangeCount);

  if (prior && lastReply) {
    model = evolveMentalModel(prior, lastReply, exchangeCount, evidence);
  }

  if (!model.pressures || model.pressures.length === 0) {
    model.pressures = computeNodePressures(model.nodes, evidence, {
      momentumLinked: model.nodes.some((n) => n.label === "Momentum" && n.state === "locked"),
      practiceBoundaryLocked: model.nodes.some((n) => n.label === "Practice" && n.state === "locked"),
    });
  }

  return model;
}

export function syncAnalysisFromModel(
  analysis: ArchitectAnalysis,
  model: ArchitectMentalModel,
): ArchitectAnalysis {
  const recommended = model.options.find((o) => o.id === model.recommendedOptionId);
  const proposedNodes = model.nodes.filter((n) => n.state === "proposed" || n.kind === "concept");

  analysis.mentalModel = model;
  analysis.confidence = modelOverallConfidence(model);
  analysis.currentUnderstanding = renderModelTreeAscii(model);
  analysis.remainingUnknowns = pressuresToBeliefs(model.pressures ?? []);
  analysis.architecturalQuestions = [];
  analysis.architectMessage = buildModelDeltaMessage(model);

  analysis.strongOpinions = model.options.map(
    (o) => `${o.label} (${o.confidence}%): ${o.reason}`,
  );

  analysis.decisionsLocked = model.nodes
    .flatMap((n) => n.assumptions.filter((a) => a.status === "locked").map((a) => `${n.label}: ${a.text}`))
    .concat(model.nodes.filter((n) => n.state === "locked").map((n) => n.label));

  analysis.assumptions = model.nodes.flatMap((n) =>
    n.assumptions.map((a) => ({
      ...a,
      text: `${n.label} — ${a.text}`,
    })),
  );

  if (recommended) {
    analysis.recommendation = `${recommended.label}. ${recommended.reason}`;
  }

  if (proposedNodes[0]) {
    analysis.potentialConcepts = [
      {
        name: proposedNodes[0].label,
        confidence: proposedNodes[0].confidence >= 80 ? "high" : "medium",
        reasoning: proposedNodes[0].annotation ?? "Emerging from mental model",
      },
    ];
    if (!analysis.suggestedInitiative.title || analysis.suggestedInitiative.title.length > 40) {
      analysis.suggestedInitiative.title = proposedNodes[0].label;
    }
  }

  analysis.architecturalRisks = model.nodes
    .filter((n) => n.confidence < 55)
    .map((n) => `Uncertain boundary: ${n.label} (${n.confidence}%)`);

  return analysis;
}

export function mentalModelFromLegacyAnalysis(
  analysis: Partial<ArchitectAnalysis>,
  exchangeCount: number,
): ArchitectMentalModel {
  const concept = analysis.potentialConcepts?.[0]?.name ?? "Emerging Concept";
  const root = node("System", { kind: "root", parentId: null, confidence: 75 });

  return {
    version: 3,
    rootId: root.id,
    nodes: [
      root,
      node(concept, {
        kind: "concept",
        parentId: root.id,
        confidence: analysis.confidence ?? 60,
        state: "proposed",
        assumptions: (analysis.assumptions ?? []).slice(0, 3),
      }),
    ],
    relationships: [],
    options: (analysis.strongOpinions ?? []).slice(0, 2).map((o, i) => ({
      id: `legacy_${i}`,
      label: `Option ${String.fromCharCode(65 + i)}`,
      preview: o.slice(0, 60),
      confidence: 60 + i * 10,
      reason: o,
    })),
    recommendedOptionId: null,
    changes: exchangeCount > 0 ? [{ type: "new_node", summary: concept }] : [],
    pressures: [],
  };
}

export function buildInitiativeFromModel(analysis: ArchitectAnalysis): string {
  const model = analysis.mentalModel;
  if (!model) return analysis.intent;

  const lines: string[] = [
    "## Mental Model Snapshot",
    "",
    "```",
    renderModelTreeAscii(model),
    "```",
    "",
    "## Relationships",
    "",
    ...model.relationships.map((r) => `- ${relationshipBelief(r)}`),
    "",
    ...(isArchitectureContested(model)
      ? [
          "## Competing Structures",
          "",
          ...model.options.map((o) => {
            const rec = o.id === model.recommendedOptionId ? " _(leading)_" : "";
            return `### ${o.label}${rec}\n\n\`\`\`\n${o.preview}\n\`\`\`\n\n${o.reason}`;
          }),
          "",
        ]
      : []),
    "## Architectural Pressure",
    "",
    ...(pressuresNeedingAttention(model.pressures ?? []).length > 0
      ? pressuresNeedingAttention(model.pressures ?? []).map((p) => {
          const evidence = formatEvidenceBrief(p.evidence);
          return `### ${p.nodeLabel}\n\n${architectBeliefForPressure(p)}${evidence ? `\n\nEvidence: ${evidence}` : ""}`;
        })
      : ["_The current model holds._"]),
    "",
    "## Model Evolution",
    "",
    ...(model.changes.length > 0
      ? model.changes.map((c) => `- ${changeToLivingLanguage(c)}`)
      : ["_No recent changes._"]),
    "",
    "## Epics",
    "",
    ...analysis.suggestedEpics.map((e) => `- ${e}`),
    "",
    "## Risks",
    "",
    ...analysis.architecturalRisks.map((r) => `- ${r}`),
    "",
    `_Initiative snapshot from Architect mental model_`,
  ];

  return lines.join("\n");
}
