import type { PrismaClient } from "@/generated/prisma/client";

export async function getPrinciples(prisma: PrismaClient) {
  return prisma.principle.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          researchQuestions: true,
          thesisLinks: true,
          projectLinks: true,
        },
      },
    },
  });
}

export async function getPrincipleBySlug(prisma: PrismaClient, slug: string) {
  return prisma.principle.findUnique({
    where: { slug },
    include: {
      researchQuestions: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { theses: true, researchNotes: true } },
        },
      },
      thesisLinks: {
        include: {
          thesis: {
            include: {
              researchQuestion: { select: { question: true } },
              _count: { select: { evidenceItems: true, initiatives: true } },
            },
          },
        },
      },
      projectLinks: {
        include: { project: { select: { name: true, slug: true } } },
      },
    },
  });
}

export async function ensurePrinciplesSeeded(prisma: PrismaClient) {
  if (!("principle" in prisma) || prisma.principle == null) {
    throw new Error(
      "Prisma client is missing ontology models. Run: npx prisma generate && restart the dev server.",
    );
  }

  const count = await prisma.principle.count();
  if (count === 0) {
    const { seedPrinciplesAndResearch } = await import("@/lib/principles/seed");
    await seedPrinciplesAndResearch(prisma);
  }
}
