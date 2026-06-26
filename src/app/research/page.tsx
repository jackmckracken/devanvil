import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { prisma } from "@/lib/db";
import { ensurePrinciplesSeeded } from "@/lib/principles/queries";
import { getResearchQuestions } from "@/lib/research/queries";

export default async function ResearchPage() {
  await ensurePrinciplesSeeded(prisma);
  const questions = await getResearchQuestions(prisma);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-10">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Research Questions
          </h1>
          <p className="mt-2 text-zinc-500">
            What are we genuinely trying to understand? Not what should we build.
          </p>
        </header>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-900">
          Research Questions have no expected answer. If a statement already contains
          the answer, it is a Thesis—not a Research Question.
        </div>

        <div className="space-y-4">
          {questions.map((rq) => {
            const leading = rq.theses[0];
            return (
              <Link
                key={rq.id}
                href={`/research/${rq.id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-orange-200"
              >
                <p className="text-lg font-medium text-zinc-900">{rq.question}</p>
                {rq.principle && (
                  <p className="mt-1 text-xs text-orange-600">
                    {rq.principle.title}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
                  <span>{rq._count.theses} theses</span>
                  <span>{rq.status}</span>
                  {leading && (
                    <span className="text-zinc-500">
                      Leading: {leading.confidence}% — {leading.statement.slice(0, 60)}
                      {leading.statement.length > 60 ? "…" : ""}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
