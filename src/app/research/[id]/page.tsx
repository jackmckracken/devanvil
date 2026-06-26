import { notFound } from "next/navigation";
import { ResearchDetail } from "@/components/research/research-detail";
import { prisma } from "@/lib/db";
import { ensurePrinciplesSeeded } from "@/lib/principles/queries";
import { getResearchQuestionById } from "@/lib/research/queries";
import type { BrainstormResult } from "@/lib/research/brainstorm";

type RouteContext = { params: Promise<{ id: string }> };

export default async function ResearchQuestionPage({ params }: RouteContext) {
  await ensurePrinciplesSeeded(prisma);
  const { id } = await params;
  const rq = await getResearchQuestionById(prisma, id);

  if (!rq) {
    notFound();
  }

  return (
    <ResearchDetail
      question={{
        ...rq,
        unknowns: Array.isArray(rq.unknowns) ? (rq.unknowns as string[]) : [],
        brainstormJson: rq.brainstormJson as BrainstormResult | null,
        principle: rq.principle
          ? { title: rq.principle.title, slug: rq.principle.slug }
          : null,
      }}
    />
  );
}
