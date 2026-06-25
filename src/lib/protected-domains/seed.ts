import type { PrismaClient } from "@/generated/prisma/client";

type DomainSeed = {
  slug: string;
  name: string;
  description: string;
  owner: string;
  protectionLevel: "advisory" | "guarded" | "protected" | "locked";
  keywords: string[];
  pathPatterns: string[];
  contractVersion?: string;
  inventoryVersion?: string;
  regressionStatus?: "passing" | "failing" | "unknown" | "not_run";
  artifacts: Array<{
    kind:
      | "adr"
      | "runtime_contract"
      | "visual_contract"
      | "catalog"
      | "golden_master"
      | "runtime_inventory"
      | "test_suite"
      | "regression_log"
      | "decision_record";
    title: string;
    path?: string;
    version?: string;
  }>;
  changeGates: Array<{ name: string; description?: string; required?: boolean }>;
  extensionPoints: {
    allowed: string[];
    requiresAdr: string[];
  };
};

const STUDIOOPS_DOMAINS: DomainSeed[] = [
  {
    slug: "bloom-runtime",
    name: "Bloom Runtime",
    description:
      "Visual runtime subsystem with architectural contracts, lifecycle ownership, golden masters, and regression suites.",
    owner: "StudioOps Platform",
    protectionLevel: "protected",
    keywords: [
      "bloom",
      "bloom runtime",
      "atom species",
      "hover panel",
      "golden master",
      "runtime inventory",
      "renderer",
    ],
    pathPatterns: [
      "**/bloom/**",
      "**/runtime/bloom/**",
      "docs/bloom/**",
    ],
    contractVersion: "1.4.0",
    inventoryVersion: "2026.06.01",
    regressionStatus: "passing",
    artifacts: [
      { kind: "runtime_contract", title: "Bloom Runtime Contract", path: "docs/bloom/runtime-contract.md", version: "1.4.0" },
      { kind: "visual_contract", title: "Bloom Visual Contract", path: "docs/bloom/visual-contract.md", version: "1.2.0" },
      { kind: "catalog", title: "Atom Species Catalog", path: "docs/bloom/catalog.md", version: "3.1.0" },
      { kind: "golden_master", title: "Bloom Golden Master", path: "docs/bloom/golden-master/", version: "2026.06.01" },
      { kind: "runtime_inventory", title: "Bloom Runtime Inventory", path: "docs/bloom/inventory.json", version: "2026.06.01" },
      { kind: "adr", title: "ADR-008 Renderer Ownership", path: "docs/adr/008-bloom-renderer-ownership.md" },
      { kind: "test_suite", title: "Bloom Runtime Tests", path: "src/bloom/__tests__/" },
      { kind: "regression_log", title: "Bloom Regression Log", path: "docs/agent-memory/regression-log.md" },
    ],
    changeGates: [
      { name: "Catalog updated", description: "Atom species catalog reflects changes", required: true },
      { name: "Runtime contract updated", required: true },
      { name: "Inventory generated", required: true },
      { name: "Golden Master diff", required: true },
      { name: "Runtime tests", required: true },
      { name: "Playwright", required: true },
      { name: "ADR (if architectural)", description: "Required when touching ownership or interaction model", required: false },
    ],
    extensionPoints: {
      allowed: ["add atom species", "add rails", "add hover panels"],
      requiresAdr: [
        "renderer ownership",
        "lifecycle ownership",
        "hover ownership",
        "projection",
        "interaction model",
      ],
    },
  },
  {
    slug: "workbench-runtime",
    name: "Workbench Runtime",
    description: "Practice and creative workbench runtime with visual and lifecycle contracts.",
    owner: "StudioOps Platform",
    protectionLevel: "advisory",
    keywords: ["workbench", "workbench runtime", "practice workbench"],
    pathPatterns: ["**/workbench/**", "docs/workbench/**"],
    artifacts: [
      { kind: "runtime_contract", title: "Workbench Runtime Contract", path: "docs/workbench/runtime-contract.md" },
      { kind: "catalog", title: "Workbench Component Catalog", path: "docs/workbench/catalog.md" },
    ],
    changeGates: [
      { name: "Runtime contract updated", required: true },
      { name: "Smoke tests", required: true },
    ],
    extensionPoints: {
      allowed: ["add panels", "add tools", "add shortcuts"],
      requiresAdr: ["layout ownership", "session lifecycle"],
    },
  },
  {
    slug: "practice-coach",
    name: "Practice Coach",
    description: "Practice coaching engine with session models and feedback loops.",
    owner: "StudioOps Product",
    protectionLevel: "advisory",
    keywords: ["practice coach", "coaching engine", "practice session", "coach feedback"],
    pathPatterns: ["**/practice-coach/**", "**/coach/**"],
    artifacts: [
      { kind: "runtime_contract", title: "Practice Coach Contract", path: "docs/practice-coach/contract.md" },
      { kind: "decision_record", title: "Coach Decision Log", path: "docs/practice-coach/decisions.md" },
    ],
    changeGates: [
      { name: "Coach contract updated", required: true },
      { name: "Unit tests", required: true },
    ],
    extensionPoints: {
      allowed: ["add drill types", "add feedback templates"],
      requiresAdr: ["scoring model", "session lifecycle"],
    },
  },
  {
    slug: "creative-whisperer",
    name: "Creative Whisperer",
    description: "AI-assisted creative guidance subsystem.",
    owner: "StudioOps AI",
    protectionLevel: "advisory",
    keywords: ["creative whisperer", "whisperer", "creative guidance"],
    pathPatterns: ["**/whisperer/**", "**/creative-whisperer/**"],
    artifacts: [
      { kind: "runtime_contract", title: "Whisperer Contract", path: "docs/whisperer/contract.md" },
      { kind: "adr", title: "Whisperer Prompt Architecture", path: "docs/adr/whisperer-prompts.md" },
    ],
    changeGates: [
      { name: "Prompt contract updated", required: true },
      { name: "Evaluation suite", required: false },
    ],
    extensionPoints: {
      allowed: ["add prompt templates", "add tone presets"],
      requiresAdr: ["model routing", "safety guardrails"],
    },
  },
  {
    slug: "credits",
    name: "Credits",
    description: "Credit balance, grants, and consumption accounting.",
    owner: "StudioOps Platform",
    protectionLevel: "advisory",
    keywords: ["credits", "credit balance", "credit grant", "credit consumption"],
    pathPatterns: ["**/credits/**", "**/billing/credits/**"],
    artifacts: [
      { kind: "runtime_contract", title: "Credits Contract", path: "docs/credits/contract.md" },
    ],
    changeGates: [
      { name: "Contract updated", required: true },
      { name: "Ledger tests", required: true },
    ],
    extensionPoints: {
      allowed: ["add credit types", "add grant rules"],
      requiresAdr: ["ledger model", "consumption policy"],
    },
  },
  {
    slug: "authentication",
    name: "Authentication",
    description: "Identity, sessions, and access control boundaries.",
    owner: "StudioOps Security",
    protectionLevel: "advisory",
    keywords: ["authentication", "auth", "session", "identity", "oauth", "login"],
    pathPatterns: ["**/auth/**", "**/authentication/**"],
    artifacts: [
      { kind: "runtime_contract", title: "Auth Contract", path: "docs/auth/contract.md" },
      { kind: "adr", title: "Session Model ADR", path: "docs/adr/session-model.md" },
    ],
    changeGates: [
      { name: "Security review", required: true },
      { name: "Auth tests", required: true },
    ],
    extensionPoints: {
      allowed: ["add OAuth providers", "add MFA methods"],
      requiresAdr: ["session storage", "token format", "permission model"],
    },
  },
  {
    slug: "billing",
    name: "Billing",
    description: "Subscriptions, invoicing, and payment integration.",
    owner: "StudioOps Platform",
    protectionLevel: "advisory",
    keywords: ["billing", "subscription", "invoice", "stripe", "payment"],
    pathPatterns: ["**/billing/**", "**/subscriptions/**"],
    artifacts: [
      { kind: "runtime_contract", title: "Billing Contract", path: "docs/billing/contract.md" },
    ],
    changeGates: [
      { name: "Billing contract updated", required: true },
      { name: "Integration tests", required: true },
    ],
    extensionPoints: {
      allowed: ["add plan tiers", "add usage meters"],
      requiresAdr: ["pricing model", "webhook handling"],
    },
  },
  {
    slug: "ai-routing",
    name: "AI Routing",
    description: "Model routing, fallbacks, and provider abstraction.",
    owner: "StudioOps AI",
    protectionLevel: "advisory",
    keywords: ["ai router", "ai routing", "model routing", "llm router", "provider fallback"],
    pathPatterns: ["**/ai-router/**", "**/ai/routing/**"],
    artifacts: [
      { kind: "runtime_contract", title: "AI Router Contract", path: "docs/ai-router/contract.md" },
      { kind: "adr", title: "Router Fallback Strategy", path: "docs/adr/ai-router-fallbacks.md" },
    ],
    changeGates: [
      { name: "Router contract updated", required: true },
      { name: "Routing tests", required: true },
    ],
    extensionPoints: {
      allowed: ["add providers", "add model aliases"],
      requiresAdr: ["routing policy", "cost caps", "fallback chains"],
    },
  },
  {
    slug: "runway",
    name: "Runway",
    description: "Release runway, feature flags, and launch coordination.",
    owner: "StudioOps Product",
    protectionLevel: "advisory",
    keywords: ["runway", "feature flag", "launch", "release runway"],
    pathPatterns: ["**/runway/**", "docs/runway/**"],
    artifacts: [
      { kind: "catalog", title: "Runway Catalog", path: "docs/runway/catalog.md" },
      { kind: "decision_record", title: "Launch Decisions", path: "docs/runway/decisions.md" },
    ],
    changeGates: [
      { name: "Runway catalog updated", required: true },
      { name: "Flag tests", required: false },
    ],
    extensionPoints: {
      allowed: ["add flags", "add launch stages"],
      requiresAdr: ["rollout policy", "kill switch model"],
    },
  },
];

export async function seedProtectedDomains(
  client: PrismaClient,
  projectSlug = "studioops",
): Promise<number> {
  const project = await client.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });

  if (!project) {
    throw new Error(`Project not found for protected domain seed: ${projectSlug}`);
  }

  let count = 0;

  for (const domain of STUDIOOPS_DOMAINS) {
    const record = await client.protectedDomain.upsert({
      where: { slug: domain.slug },
      update: {
        name: domain.name,
        description: domain.description,
        owner: domain.owner,
        protectionLevel: domain.protectionLevel,
        projectId: project.id,
        keywords: domain.keywords,
        pathPatterns: domain.pathPatterns,
        contractVersion: domain.contractVersion ?? null,
        inventoryVersion: domain.inventoryVersion ?? null,
        regressionStatus: domain.regressionStatus ?? "unknown",
        status: "active",
      },
      create: {
        slug: domain.slug,
        name: domain.name,
        description: domain.description,
        owner: domain.owner,
        protectionLevel: domain.protectionLevel,
        projectId: project.id,
        keywords: domain.keywords,
        pathPatterns: domain.pathPatterns,
        contractVersion: domain.contractVersion ?? null,
        inventoryVersion: domain.inventoryVersion ?? null,
        regressionStatus: domain.regressionStatus ?? "unknown",
      },
    });

    await client.protectedDomainArtifact.deleteMany({ where: { domainId: record.id } });
    await client.protectedDomainChangeGate.deleteMany({ where: { domainId: record.id } });
    await client.protectedDomainExtensionPoint.deleteMany({ where: { domainId: record.id } });

    if (domain.artifacts.length > 0) {
      await client.protectedDomainArtifact.createMany({
        data: domain.artifacts.map((artifact) => ({
          domainId: record.id,
          kind: artifact.kind,
          title: artifact.title,
          path: artifact.path ?? null,
          version: artifact.version ?? null,
        })),
      });
    }

    if (domain.changeGates.length > 0) {
      await client.protectedDomainChangeGate.createMany({
        data: domain.changeGates.map((gate, index) => ({
          domainId: record.id,
          name: gate.name,
          description: gate.description ?? null,
          required: gate.required ?? true,
          sortOrder: index,
        })),
      });
    }

    const extensionPoints = [
      ...domain.extensionPoints.allowed.map((name) => ({
        domainId: record.id,
        name,
        category: "allowed" as const,
      })),
      ...domain.extensionPoints.requiresAdr.map((name) => ({
        domainId: record.id,
        name,
        category: "requires_adr" as const,
      })),
    ];

    if (extensionPoints.length > 0) {
      await client.protectedDomainExtensionPoint.createMany({
        data: extensionPoints,
      });
    }

    count += 1;
  }

  return count;
}
