import type { WorkflowCommand } from "@/generated/prisma/client";
import { getCommandBySlash } from "@/lib/workflow/commands";
import { isInvestmentInput } from "@/lib/investments/classify";

const NATURAL_INTAKE_PATTERNS = [
  /^i\s+(want|think|noticed|feel|wonder|wish)\b/i,
  /^we\s+(need|should|want|could)\b/i,
  /^this\s+feels\s+(wrong|off|broken|slow|cramped)/i,
  /^i\s+had\s+an\s+idea/i,
  /^what\s+if\b/i,
  /^artists\s+should\b/i,
  /^users\s+should\b/i,
];

const INVESTIGATE_PATTERNS = [
  /\bsometimes\b/i,
  /\bintermittent(ly)?\b/i,
  /\bloads?\s+slow(ly)?\b/i,
  /\bfeels?\s+inconsistent\b/i,
  /\bflash(es|ing)?\b/i,
  /\bnot\s+sure\s+why\b/i,
  /\bunknown\b/i,
];

const CHANGE_CLASSIFY_PATTERNS = [
  /\bshould\s+(hover|scroll|feel|look)\b/i,
  /\bfeels?\s+(cramped|tight|janky|sluggish)\b/i,
  /\ba\s+little\s+(farther|closer|smoother|faster)\b/i,
  /\bpolish\b/i,
  /\brefactor\b/i,
  /\bugly\b/i,
  /\btweak\b/i,
];

const SHIP_PATTERNS = [/^\/ship\b/i, /\bready\s+to\s+ship\b/i, /\bship\s+(current|this|dev-)/i];

export type ParsedInput = {
  command: WorkflowCommand;
  body: string;
  wasExplicitCommand: boolean;
};

export function parseWorkflowInput(raw: string): ParsedInput {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      command: "architectural_intake",
      body: "",
      wasExplicitCommand: false,
    };
  }

  const lines = trimmed.split("\n");
  const firstLine = lines[0]?.trim() ?? "";

  if (firstLine.startsWith("/")) {
    const spaceIdx = firstLine.indexOf(" ");
    const slashPart = spaceIdx === -1 ? firstLine : firstLine.slice(0, spaceIdx);
    const restOfFirstLine = spaceIdx === -1 ? "" : firstLine.slice(spaceIdx + 1).trim();
    const remainingLines = lines.slice(1).join("\n").trim();
    const body = [restOfFirstLine, remainingLines].filter(Boolean).join("\n").trim();

    const cmd = getCommandBySlash(slashPart);
    if (cmd) {
      return {
        command: cmd.id,
        body: body || trimmed.replace(slashPart, "").trim(),
        wasExplicitCommand: true,
      };
    }
  }

  if (SHIP_PATTERNS.some((p) => p.test(trimmed))) {
    return { command: "ship", body: trimmed, wasExplicitCommand: false };
  }

  if (INVESTIGATE_PATTERNS.some((p) => p.test(trimmed))) {
    return { command: "investigate", body: trimmed, wasExplicitCommand: false };
  }

  if (CHANGE_CLASSIFY_PATTERNS.some((p) => p.test(trimmed))) {
    return { command: "change_classify", body: trimmed, wasExplicitCommand: false };
  }

  if (isInvestmentInput(trimmed)) {
    return { command: "investment", body: trimmed, wasExplicitCommand: false };
  }

  if (NATURAL_INTAKE_PATTERNS.some((p) => p.test(trimmed))) {
    return { command: "architectural_intake", body: trimmed, wasExplicitCommand: false };
  }

  return { command: "architectural_intake", body: trimmed, wasExplicitCommand: false };
}
