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

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <ItemDetail
          item={{
            ...item,
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
