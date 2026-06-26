import type { ResearchQuestion } from "@/generated/prisma/client";

export type BrainstormResult = {
  themes: { label: string; explanations: string[] }[];
  assumptions: string[];
  competingTheses: string[];
  recommendedResearch: string[];
  affectedProducts: string[];
  suggestedInvestments: string[];
  suggestedExperiments: string[];
  generatedAt: string;
};

export function generateBrainstorm(
  question: Pick<ResearchQuestion, "question" | "whyItMatters" | "unknowns">,
): BrainstormResult {
  const unknowns = Array.isArray(question.unknowns)
    ? (question.unknowns as string[])
    : [];

  const themes = [
    {
      label: "Human factors",
      explanations: [
        `People may disengage when ${question.question.replace(/^Why do /i, "").replace(/\?$/, "")} due to loss of emotional connection.`,
        "Motivation decay over time without visible progress.",
        "Identity misalignment between the creator and the work.",
      ],
    },
    {
      label: "System & tooling",
      explanations: [
        "Current tools fragment the creative lifecycle.",
        "Feedback loops are too slow or too absent.",
        "Technical complexity exceeds available skill at the moment of abandonment.",
      ],
    },
    {
      label: "Social & mentorship",
      explanations: [
        "Lack of continuous guidance at critical decision points.",
        "Isolation during the hardest phases of the work.",
        "No external mirror to reflect when something is 'good enough'.",
      ],
    },
  ];

  const competingTheses = themes.flatMap((t) =>
    t.explanations.slice(0, 2).map((e) => {
      const core = e.replace(/^People may /i, "").replace(/\.$/, "");
      return core.charAt(0).toUpperCase() + core.slice(1) + ".";
    }),
  );

  return {
    themes,
    assumptions: [
      "The problem is primarily behavioral, not purely technical.",
      "Users can articulate why they abandoned work if asked correctly.",
      "Improving one factor may not fix the whole system.",
      ...unknowns.map((u) => `We assume: ${u}`),
    ],
    competingTheses: competingTheses.slice(0, 6),
    recommendedResearch: [
      "Interview 5–8 users who abandoned work in the last 30 days.",
      "Analyze completion funnel drop-off points.",
      "Compare cohorts with and without mentorship features.",
      "Review competitor approaches to continuity and feedback.",
    ],
    affectedProducts: ["StudioOps", "DevAnvil", "Heirloom"],
    suggestedInvestments: [
      "Practice Coach continuity features",
      "Decision history and institutional memory",
      "Progress visibility surfaces",
    ],
    suggestedExperiments: [
      "A/B test delayed vs immediate feedback on song completion.",
      "Prototype a 'finished definition' wizard for new artists.",
      "Run a 2-week mentorship cohort with 10 beta users.",
    ],
    generatedAt: new Date().toISOString(),
  };
}
