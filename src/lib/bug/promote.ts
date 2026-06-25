import { prisma } from "@/lib/db";
import { assertCapturePromotable, markCapturePromoted } from "@/lib/capture/promote";
import { analyzeBugCapture } from "@/lib/bug/analyze";
import type { BugWorkItemResult } from "@/lib/bug/types";
import { buildBranchName, buildSuggestedCommand } from "@/lib/text";

export async function promoteCaptureToBug(
  captureId: string,
  projectSlug: string,
): Promise<BugWorkItemResult> {
  const capture = await assertCapturePromotable(captureId);
  const analysis = await analyzeBugCapture(capture.rawText, projectSlug);

  const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
  if (!project) throw new Error(`Project not found: ${projectSlug}`);

  const acceptanceMarkdown = analysis.acceptanceCriteria
    .map((criterion, index) => `${index + 1}. ${criterion}`)
    .join("\n");

  const workItem = await prisma.devItem.create({
    data: {
      projectId: project.id,
      title: analysis.title,
      rawText: capture.rawText,
      normalizedSummary: analysis.summary,
      sourceType: capture.sourceType,
      itemType: "bug",
      status: "approved",
      priority: "medium",
      isCapture: false,
      sourceCaptureId: captureId,
      suggestedBranchName: buildBranchName("bug", analysis.title),
      suggestedCommand: buildSuggestedCommand("bug", analysis.title, projectSlug),
      artifacts: {
        create: [
          {
            artifactType: "note",
            content: `Source capture: ${captureId}\n\nSymptom:\n${analysis.symptom}`,
            metadataJson: { sourceCaptureId: captureId },
          },
          {
            artifactType: "note",
            content: `Acceptance criteria:\n\n${acceptanceMarkdown}`,
            metadataJson: { kind: "acceptance_criteria" },
          },
        ],
      },
      activity: {
        create: {
          action: "promoted:bug",
          note: `Bug work item created from capture ${captureId}`,
        },
      },
    },
  });

  await markCapturePromoted(
    captureId,
    "bug",
    `Promoted to bug work item ${workItem.id}`,
  );

  return {
    workItemId: workItem.id,
    captureId,
    title: workItem.title,
    acceptanceCriteria: analysis.acceptanceCriteria,
    affectedDomains: analysis.affectedDomains.map((d) => d.domain.name),
    projectSlug,
  };
}
