import { prisma } from "@/lib/db";
import { assertCapturePromotable, markCapturePromoted } from "@/lib/capture/promote";
import { isTrivialResearchCapture } from "@/lib/capture/research-heuristics";

export async function promoteCaptureToResearch(captureId: string) {
  const capture = await assertCapturePromotable(captureId);

  if (!isTrivialResearchCapture(capture.rawText)) {
    throw new Error(
      "This capture looks substantive — use Architect or Audit instead of Research",
    );
  }

  await prisma.devItem.update({
    where: { id: captureId },
    data: {
      status: "archived",
      artifacts: {
        create: {
          artifactType: "note",
          content: `Reference material (research)\n\n${capture.rawText}`,
          metadataJson: { kind: "research_reference", sourceCaptureId: captureId },
        },
      },
    },
  });

  await markCapturePromoted(
    captureId,
    "research",
    "Filed as reference material — no execution workflow",
  );

  return {
    captureId,
    status: "research" as const,
    projectSlug: capture.projectSlug,
  };
}
