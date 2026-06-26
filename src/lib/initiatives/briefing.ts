import type { StrategicValue } from "@/generated/prisma/client";

export type ExpectedOutcome = {
  artistImpact: number;
  businessImpact: number;
  learningValue: number;
  strategicLeverage: number;
  revenuePotential: number;
};

export type InitiativeBriefing = {
  thesis: string;
  outcomes: string[];
  expectedOutcome: ExpectedOutcome;
};

const OUTCOMES_BY_VALUE: Record<StrategicValue, string[]> = {
  beta_critical: [
    "Increase artist retention",
    "Complete creative lifecycle",
    "Reduce abandoned songs",
    "Increase beta wow moments",
  ],
  launch_critical: [
    "Complete product lifecycle",
    "Remove launch blockers",
    "Increase launch confidence",
  ],
  growth: [
    "Increase user acquisition",
    "Improve activation rates",
    "Expand addressable use cases",
  ],
  infrastructure: [
    "Reduce engineering friction",
    "Increase development velocity",
    "Enable future features",
  ],
  delight: [
    "Increase user satisfaction",
    "Strengthen product identity",
    "Create memorable experiences",
  ],
  research: [
    "Validate assumptions",
    "Reduce uncertainty",
    "Inform future investments",
  ],
  future_vision: [
    "Explore strategic direction",
    "Build long-term capability",
    "Maintain optionality",
  ],
};

const OUTCOME_BY_VALUE: Record<StrategicValue, ExpectedOutcome> = {
  beta_critical: {
    artistImpact: 90,
    businessImpact: 70,
    learningValue: 60,
    strategicLeverage: 40,
    revenuePotential: 35,
  },
  launch_critical: {
    artistImpact: 55,
    businessImpact: 95,
    learningValue: 45,
    strategicLeverage: 50,
    revenuePotential: 60,
  },
  growth: {
    artistImpact: 70,
    businessImpact: 75,
    learningValue: 40,
    strategicLeverage: 45,
    revenuePotential: 85,
  },
  infrastructure: {
    artistImpact: 25,
    businessImpact: 60,
    learningValue: 70,
    strategicLeverage: 90,
    revenuePotential: 30,
  },
  delight: {
    artistImpact: 85,
    businessImpact: 50,
    learningValue: 35,
    strategicLeverage: 30,
    revenuePotential: 40,
  },
  research: {
    artistImpact: 20,
    businessImpact: 30,
    learningValue: 95,
    strategicLeverage: 55,
    revenuePotential: 15,
  },
  future_vision: {
    artistImpact: 15,
    businessImpact: 25,
    learningValue: 80,
    strategicLeverage: 70,
    revenuePotential: 10,
  },
};

export function extractThesis(
  title: string,
  description: string | null,
  linkedThesis?: string | null,
): string {
  if (linkedThesis) return linkedThesis;

  if (!description) {
    return `Invest engineering capital in ${title.toLowerCase()}.`;
  }

  const intentMatch = description.match(/## Intent\s*\n+([^\n#]+)/);
  if (intentMatch?.[1]) {
    return intentMatch[1].trim();
  }

  const firstParagraph = description
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("```"))
    .find((l) => l.length > 20);

  if (firstParagraph) {
    return firstParagraph.length > 200
      ? firstParagraph.slice(0, 197) + "..."
      : firstParagraph;
  }

  return `Transform ${title.toLowerCase()} from concept into shipped capability.`;
}

export function buildBriefing(
  title: string,
  description: string | null,
  strategicValue: StrategicValue,
  linkedThesis?: string | null,
): InitiativeBriefing {
  return {
    thesis: extractThesis(title, description, linkedThesis),
    outcomes: OUTCOMES_BY_VALUE[strategicValue],
    expectedOutcome: OUTCOME_BY_VALUE[strategicValue],
  };
}
