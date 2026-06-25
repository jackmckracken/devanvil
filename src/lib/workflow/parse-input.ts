import type { WorkflowCommand } from "@/generated/prisma/client";
import { getCommandBySlash } from "@/lib/workflow/commands";

export type ParsedInput = {
  command: WorkflowCommand;
  body: string;
  wasExplicitCommand: boolean;
};

/** Parse slash commands only. Natural language always becomes capture at submit time. */
export function parseWorkflowInput(raw: string): ParsedInput {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      command: "capture",
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

  return { command: "capture", body: trimmed, wasExplicitCommand: false };
}
