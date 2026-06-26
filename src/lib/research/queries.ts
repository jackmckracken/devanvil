import type { PrismaClient } from "@/generated/prisma/client";

export async function getResearchQuestions(prisma: PrismaClient) {
  return prisma.researchQuestion.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      principle: { select: { title: true, slug: true } },
      _count: { select: { theses: true, researchNotes: true } },
      theses: {
        orderBy: [{ status: "asc" }, { confidence: "desc" }],
        take: 1,
      },
    },
  });
}

export async function getResearchQuestionById(prisma: PrismaClient, id: string) {
  return prisma.researchQuestion.findUnique({
    where: { id },
    include: {
      principle: true,
      theses: {
        orderBy: [{ status: "asc" }, { confidence: "desc" }],
        include: {
          evidenceItems: { orderBy: { createdAt: "desc" } },
          initiatives: {
            select: { id: true, title: true, status: true },
          },
          projectLinks: {
            include: { project: { select: { name: true, slug: true } } },
          },
          confidenceSnapshots: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
      researchNotes: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getThesisById(prisma: PrismaClient, id: string) {
  return prisma.thesis.findUnique({
    where: { id },
    include: {
      researchQuestion: {
        include: { principle: true },
      },
      evidenceItems: { orderBy: { createdAt: "desc" } },
      initiatives: {
        include: { project: { select: { name: true, slug: true } } },
      },
      projectLinks: {
        include: { project: { select: { name: true, slug: true } } },
      },
      principleLinks: {
        include: { principle: { select: { title: true, slug: true } } },
      },
      confidenceSnapshots: { orderBy: { createdAt: "desc" } },
    },
  });
}
