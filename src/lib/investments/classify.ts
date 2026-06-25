import type { InvestmentCategory, InvestmentLeverage } from "@/generated/prisma/client";
import { extractSummary, extractTitle } from "@/lib/text";
import { INVESTMENT_CATEGORIES } from "@/lib/investments/categories";

export type InvestmentClassification = {
  isInvestment: boolean;
  confidence: number;
  title: string;
  summary: string;
  category: InvestmentCategory;
  capabilityTarget: string;
  intentConnection: string | null;
  leverage: InvestmentLeverage;
  estimatedHours: number | null;
  compoundingValue: string;
  enablesWork: string[];
};

const PRODUCT_PATTERNS = [
  /\b(artists?|users?|customers?)\s+(should|need|want|could)\b/i,
  /\b(add|build|implement|ship|create)\s+(a\s+)?(feature|page|screen|api|endpoint)\b/i,
  /\bworkbench\b/i,
  /\bbloom\b/i,
  /\bprotected\s+domain\b/i,
  /\bforge\b/i,
  /\bshortcut(s)?\s+(download|auth)/i,
  /\bhover\s+panel/i,
  /\bdashboard\s+card/i,
];

const INVESTMENT_PATTERNS: { pattern: RegExp; weight: number }[] = [
  { pattern: /\b(learn|study|read|watch|practice|master)\b/i, weight: 3 },
  { pattern: /\b(course|book|tutorial|documentation|docs)\b/i, weight: 2 },
  { pattern: /\b(clean|organize|tidy)\s+(my\s+)?(studio|workspace|desk|office)\b/i, weight: 4 },
  { pattern: /\bupgrade\s+to\b/i, weight: 3 },
  { pattern: /\bexperiment\s+with\b/i, weight: 3 },
  { pattern: /\b(prototype|spike|poc|proof\s+of\s+concept)\b/i, weight: 3 },
  { pattern: /\bexplore\s+(a\s+new|the|an)\s+/i, weight: 2 },
  { pattern: /\bbuild\s+a\s+(pedalboard|setup|rig|home\s+studio)\b/i, weight: 4 },
  { pattern: /\b(conference|networking|mentor(ship)?|community)\b/i, weight: 2 },
  { pattern: /\b(exercise|sleep|recovery|health)\s+(routine|habit|schedule)?\b/i, weight: 2 },
  { pattern: /\blearn\s+mcp\b/i, weight: 5 },
  { pattern: /\b(komplete\s+kontrol|ableton|push\s+\d|midi\s+controller)\b/i, weight: 3 },
  { pattern: /\bi(?:'d| would)\s+like\s+to\s+learn\b/i, weight: 5 },
  { pattern: /\bi\s+should\s+(learn|clean|organize|read|practice)\b/i, weight: 4 },
  { pattern: /\bwant\s+to\s+learn\b/i, weight: 4 },
  { pattern: /\bnew\s+(ai\s+)?model\b/i, weight: 2 },
  { pattern: /\bworkflow\s+improvement\b/i, weight: 2 },
  { pattern: /\bbuy\s+(a\s+)?(midi|controller|interface|mic)\b/i, weight: 3 },
];

const CATEGORY_SIGNALS: Record<InvestmentCategory, RegExp[]> = {
  learning: [/\b(learn|study|read|book|course|tutorial|practice|watch)\b/i],
  experimentation: [/\b(experiment|prototype|spike|explore|poc|creative)\b/i],
  environment: [/\b(clean|organize|studio|workspace|pedalboard|equipment|setup)\b/i],
  infrastructure: [/\b(upgrade|mcp|sdk|tooling|automation|framework|dependency)\b/i],
  relationships: [/\b(network|mentor|community|conference|meetup)\b/i],
  business: [/\b(market|customer|interview|research|competitor)\b/i],
  health: [/\b(exercise|sleep|recovery|health|routine)\b/i],
};

function scoreInvestment(text: string): number {
  let score = 0;
  for (const { pattern, weight } of INVESTMENT_PATTERNS) {
    if (pattern.test(text)) score += weight;
  }
  for (const pattern of PRODUCT_PATTERNS) {
    if (pattern.test(text)) score -= 4;
  }
  return score;
}

function detectCategory(text: string): InvestmentCategory {
  const lower = text.toLowerCase();
  let best: InvestmentCategory = "learning";
  let bestScore = 0;

  for (const [category, patterns] of Object.entries(CATEGORY_SIGNALS) as [
    InvestmentCategory,
    RegExp[],
  ][]) {
    const score = patterns.reduce((acc, p) => acc + (p.test(lower) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }

  return best;
}

function estimateLeverage(text: string, category: InvestmentCategory): InvestmentLeverage {
  const lower = text.toLowerCase();
  if (/\b(sdk|mcp|framework|platform|automation)\b/i.test(lower)) return "compound";
  if (category === "infrastructure" || category === "experimentation") return "high";
  if (category === "learning" && /\b(master|deep\s+dive|certification)\b/i.test(lower)) {
    return "high";
  }
  if (category === "environment" || category === "health") return "medium";
  return "medium";
}

function estimateHours(text: string, category: InvestmentCategory): number | null {
  const lower = text.toLowerCase();
  if (/\b(book|course)\b/i.test(lower)) return 20;
  if (/\b(clean|organize)\b/i.test(lower)) return 3;
  if (/\b(pedalboard|setup)\b/i.test(lower)) return 8;
  if (/\bupgrade\b/i.test(lower)) return 4;
  if (category === "experimentation") return 6;
  if (category === "learning") return 10;
  return null;
}

function deriveCapabilityTarget(text: string, category: InvestmentCategory): string {
  const title = extractTitle(text);
  const meta = INVESTMENT_CATEGORIES.find((c) => c.id === category);

  if (/\blearn\b/i.test(text)) {
    const subject = text.replace(/.*\blearn\b\s*/i, "").replace(/[.!?].*$/, "").trim();
    if (subject) return `Ability to use ${subject} effectively`;
  }

  if (/\b(clean|organize)\b/i.test(text)) {
    return "Faster studio setup and reduced friction starting creative work";
  }

  if (/\b(pedalboard|rig)\b/i.test(text)) {
    return "Reliable live performance setup ready for gigs";
  }

  if (/\bupgrade\b/i.test(text)) {
    return "Access to improved tools and workflows in upgraded software";
  }

  if (/\bexperiment\b/i.test(text)) {
    return `Knowledge of feasibility and constraints for ${title.toLowerCase()}`;
  }

  return meta?.description ?? `Increased capability from: ${title}`;
}

function deriveIntentConnection(text: string): string | null {
  const lower = text.toLowerCase();
  if (/\b(ableton|midi|push|komplete|production|songwriting)\b/i.test(lower)) {
    return "Help artists finish more songs and improve production speed";
  }
  if (/\b(mcp|sdk|automation|tooling)\b/i.test(lower)) {
    return "Increase builder velocity and reduce implementation friction";
  }
  if (/\b(studio|workspace|organize)\b/i.test(lower)) {
    return "Reduce friction between inspiration and creation";
  }
  if (/\b(health|sleep|exercise)\b/i.test(lower)) {
    return "Sustain long-term creative output and decision quality";
  }
  return null;
}

function suggestEnablesWork(text: string, category: InvestmentCategory): string[] {
  const lower = text.toLowerCase();
  const enables: string[] = [];

  if (/\bableton\s+sdk\b/i.test(lower)) {
    enables.push("Workbench MIDI Integration", "Push Integration", "Live Clip Launcher");
  }
  if (/\bkomplete\s+kontrol\b/i.test(lower)) {
    enables.push("Faster production workflows", "Template-based song starts");
  }
  if (/\b(clean|organize)\s+studio\b/i.test(lower)) {
    enables.push("Daily songwriting habit", "Faster session starts");
  }
  if (/\bmcp\b/i.test(lower)) {
    enables.push("Agent automation", "DevAnvil MCP integrations");
  }
  if (category === "experimentation" && enables.length === 0) {
    enables.push("Future feature work informed by spike findings");
  }

  return enables;
}

function deriveCompoundingValue(leverage: InvestmentLeverage, category: InvestmentCategory): string {
  if (leverage === "compound") {
    return "Compounds across every future project — capability never needs re-learning";
  }
  if (category === "learning") {
    return "Each hour invested reduces friction on all future work in this domain";
  }
  if (category === "environment") {
    return "Daily time savings compound into weeks of extra creative output per year";
  }
  if (category === "health") {
    return "Better energy and focus improve quality of every decision and session";
  }
  return "Builds capability that makes future features easier to ship";
}

export function classifyInvestment(text: string): InvestmentClassification {
  const score = scoreInvestment(text);
  const isInvestment = score >= 3;

  const title = extractTitle(text);
  const summary = extractSummary(text);
  const category = detectCategory(text);
  const leverage = estimateLeverage(text, category);
  const estimatedHours = estimateHours(text, category);
  const capabilityTarget = deriveCapabilityTarget(text, category);
  const intentConnection = deriveIntentConnection(text);
  const enablesWork = suggestEnablesWork(text, category);
  const compoundingValue = deriveCompoundingValue(leverage, category);

  return {
    isInvestment,
    confidence: Math.min(0.95, 0.4 + score * 0.08),
    title,
    summary,
    category,
    capabilityTarget,
    intentConnection,
    leverage,
    estimatedHours,
    compoundingValue,
    enablesWork,
  };
}

export function isInvestmentInput(text: string): boolean {
  return classifyInvestment(text).isInvestment;
}
