import type { WorkflowCommand } from "@/generated/prisma/client";

export type CommandDefinition = {
  id: WorkflowCommand;
  slash: string;
  label: string;
  description: string;
  placeholder: string;
  examples: string[];
};

export const WORKFLOW_COMMANDS: CommandDefinition[] = [
  {
    id: "capture",
    slash: "/capture",
    label: "Capture",
    description:
      "Frictionless capture — preserve the thought. No domains, no planning, no work items.",
    placeholder: "Bloom hover needs another state...",
    examples: [
      "Artists need Creative Investments.",
      "Workbench should support...",
      "This belongs in Runway.",
      "We should rethink Memory.",
    ],
  },
  {
    id: "investment",
    slash: "/investment",
    label: "Investment",
    description:
      "Capture capability-building activity — learning, experimentation, environment, tooling. Not a feature or bug.",
    placeholder: "I'd like to learn Komplete Kontrol...",
    examples: [
      "I'd like to learn Komplete Kontrol.",
      "I should clean my studio.",
      "I want to build a pedalboard.",
      "I should learn MCP.",
    ],
  },
  {
    id: "architectural_intake",
    slash: "/architect",
    label: "Architect",
    description:
      "Interactive architectural thinking partner. Understand intent before any implementation.",
    placeholder: "Open architect on a captured idea from your inbox...",
    examples: [
      "Analyze Creative Investments from inbox",
      "What does this idea mean architecturally?",
    ],
  },
  {
    id: "change_classify",
    slash: "/change-classify",
    label: "Change Classify",
    description:
      "Classify bugs, polish, refactors, and small UX tweaks. Determines protection level and required evidence.",
    placeholder: "Atoms should hover a little farther away...",
    examples: [
      "Atoms should hover a little farther away.",
      "Workbench should scroll smoother.",
      "Dashboard cards feel cramped.",
    ],
  },
  {
    id: "investigate",
    slash: "/investigate",
    label: "Investigate",
    description:
      "Explore unknown problems. Produces an investigation with hypotheses — no implementation yet.",
    placeholder: "Bloom atoms sometimes flash...",
    examples: [
      "Bloom atoms sometimes flash.",
      "Workbench loads slowly.",
      "Prompt generation feels inconsistent.",
    ],
  },
  {
    id: "ship",
    slash: "/ship",
    label: "Ship",
    description:
      "Run the architectural method. Collect evidence, check gates, and produce a ship report.",
    placeholder: "Ship DEV-abc123 or describe what to ship...",
    examples: ["Ship current forge work", "Ready to ship bloom hover fix"],
  },
];

export function getCommandById(id: WorkflowCommand): CommandDefinition {
  const cmd = WORKFLOW_COMMANDS.find((c) => c.id === id);
  if (!cmd) throw new Error(`Unknown command: ${id}`);
  return cmd;
}

export function getCommandBySlash(slash: string): CommandDefinition | null {
  const normalized = slash.toLowerCase().trim();
  if (normalized === "/architectural-intake") {
    return WORKFLOW_COMMANDS.find((c) => c.id === "capture") ?? null;
  }
  return (
    WORKFLOW_COMMANDS.find(
      (c) => c.slash === normalized || c.slash.slice(1) === normalized.slice(1),
    ) ?? null
  );
}
