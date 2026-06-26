import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { prisma } from "@/lib/db";
import {
  ensurePrinciplesSeeded,
  getPrincipleBySlug,
} from "@/lib/principles/queries";

type RouteContext = { params: Promise<{ slug: string }> };

export default async function PrincipleDetailPage({ params }: RouteContext) {
  await ensurePrinciplesSeeded(prisma);
  const { slug } = await params;
  const principle = await getPrincipleBySlug(prisma, slug);

  if (!principle) {
    notFound();
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-10">
        <Link href="/principles" className="text-sm text-zinc-500 hover:text-orange-600">
          ← Principles
        </Link>

        <header className="space-y-4 border-b border-zinc-200 pb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
            Principle
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
            {principle.title}
          </h1>
          <p className="text-lg leading-relaxed text-zinc-600">
            {principle.description}
          </p>
          {principle.originStory && (
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Origin Story
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                {principle.originStory}
              </p>
            </div>
          )}
        </header>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Research Questions
          </h2>
          {principle.researchQuestions.length === 0 ? (
            <p className="text-sm text-zinc-500">No research questions yet.</p>
          ) : (
            <div className="space-y-3">
              {principle.researchQuestions.map((rq) => (
                <Link
                  key={rq.id}
                  href={`/research/${rq.id}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-orange-200"
                >
                  <p className="font-medium text-zinc-900">{rq.question}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {rq._count.theses} competing theses · {rq.status}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Related Theses
          </h2>
          <div className="space-y-2">
            {principle.thesisLinks.map(({ thesis }) => (
              <Link
                key={thesis.id}
                href={`/theses/${thesis.id}`}
                className="block rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 hover:border-orange-200"
              >
                <p className="text-sm text-zinc-800">{thesis.statement}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {thesis.researchQuestion.question} · {thesis.confidence}% confidence
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Products
          </h2>
          <div className="flex flex-wrap gap-2">
            {principle.projectLinks.map(({ project }) => (
              <Link
                key={project.slug}
                href={`/focus?project=${project.slug}`}
                className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 hover:bg-orange-50 hover:text-orange-700"
              >
                {project.name}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
