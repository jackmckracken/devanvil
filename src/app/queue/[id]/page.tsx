import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ItemDetail } from "@/components/item-detail";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export default async function ItemDetailPage(context: RouteContext) {
  const { id } = await context.params;

  const item = await prisma.devItem.findUnique({
    where: { id },
    include: {
      project: true,
      duplicateOf: {
        select: { id: true, title: true, status: true },
      },
      sourceCapture: {
        select: { id: true, rawText: true, isCapture: true },
      },
      artifacts: {
        orderBy: { createdAt: "asc" },
      },
      matches: {
        include: {
          matchedItem: {
            select: {
              id: true,
              title: true,
              status: true,
              project: { select: { name: true } },
            },
          },
        },
        orderBy: { similarityScore: "desc" },
      },
      activity: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!item) {
    notFound();
  }

  const acceptanceArtifact = item.artifacts.find(
    (a) =>
      a.metadataJson &&
      typeof a.metadataJson === "object" &&
      (a.metadataJson as { kind?: string }).kind === "acceptance_criteria",
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <ItemDetail
          item={{
            ...item,
            sourceCaptureId: item.sourceCaptureId,
            sourceCapture: item.sourceCapture,
            acceptanceCriteria: acceptanceArtifact?.content ?? null,
            createdAt: item.createdAt.toISOString(),
            activity: item.activity.map((entry) => ({
              ...entry,
              createdAt: entry.createdAt.toISOString(),
            })),
          }}
        />
      </main>
    </>
  );
}
