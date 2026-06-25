import type { InvestmentCategory, InvestmentLeverage } from "@/generated/prisma/client";

export type InvestmentCategoryMeta = {
  id: InvestmentCategory;
  label: string;
  description: string;
  examples: string[];
};

export const INVESTMENT_CATEGORIES: InvestmentCategoryMeta[] = [
  {
    id: "learning",
    label: "Learning",
    description: "Courses, books, tutorials, practice",
    examples: ["Learn Komplete Kontrol", "Read a songwriting book", "Watch a conference talk"],
  },
  {
    id: "experimentation",
    label: "Experimentation",
    description: "Prototypes, creative exploration, technology spikes",
    examples: ["Experiment with Ableton SDK", "Prototype a new workflow", "Explore a new AI model"],
  },
  {
    id: "environment",
    label: "Environment",
    description: "Studio organization, workspace, equipment, maintenance",
    examples: ["Clean and organize the studio", "Build a live performance pedalboard"],
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    description: "Dependencies, framework upgrades, tooling, automation",
    examples: ["Upgrade to Ableton 12", "Learn MCP", "Set up CI automation"],
  },
  {
    id: "relationships",
    label: "Relationships",
    description: "Networking, mentorship, community",
    examples: ["Attend a local producer meetup", "Find a mentor"],
  },
  {
    id: "business",
    label: "Business",
    description: "Market research, customer interviews, conferences",
    examples: ["Interview beta artists", "Research competitor pricing"],
  },
  {
    id: "health",
    label: "Health",
    description: "Exercise, sleep, recovery — anything that improves long-term execution",
    examples: ["Establish a morning exercise routine", "Fix sleep schedule"],
  },
];

export const LEVERAGE_LABELS: Record<InvestmentLeverage, string> = {
  low: "Low — helpful but narrow",
  medium: "Medium — meaningful capability gain",
  high: "High — unlocks significant new work",
  compound: "Compound — pays dividends across many future projects",
};

export function getCategoryMeta(id: InvestmentCategory): InvestmentCategoryMeta {
  const meta = INVESTMENT_CATEGORIES.find((c) => c.id === id);
  if (!meta) throw new Error(`Unknown category: ${id}`);
  return meta;
}
