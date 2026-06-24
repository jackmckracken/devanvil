import { prisma } from "@/lib/db";
import { assertFound } from "@/mcp/errors";
import type { z } from "zod";
import type { linkBranchSchema } from "@/mcp/schemas";

type LinkBranchInput = z.infer<typeof linkBranchSchema>;

export async function linkBranch(input: LinkBranchInput) {
  const item = await prisma.devItem.findUnique({
    where: { id: input.itemId },
    select: {
      id: true,
      title: true,
      suggestedCommand: true,
    },
  });

  assertFound(item, `Item not found: ${input.itemId}`);

  const build = await prisma.devBuild.create({
    data: {
      devItemId: input.itemId,
      repo: input.repo,
      branchName: input.branchName,
      commandUsed: input.commandUsed ?? item.suggestedCommand,
      planDocPath: input.planDocPath,
      contractReportPath: input.contractReportPath,
      status: "active",
    },
  });

  await prisma.devActivity.create({
    data: {
      devItemId: input.itemId,
      action: "branch_linked",
      note:
        input.note ??
        `Linked branch ${input.branchName} in ${input.repo} via MCP`,
    },
  });

  return {
    buildId: build.id,
    itemId: item.id,
    itemTitle: item.title,
    repo: build.repo,
    branchName: build.branchName,
    commandUsed: build.commandUsed,
    planDocPath: build.planDocPath,
    contractReportPath: build.contractReportPath,
    status: build.status,
    createdAt: build.createdAt.toISOString(),
  };
}
