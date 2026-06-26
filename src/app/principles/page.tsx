import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { prisma } from "@/lib/db";
import {
  ensurePrinciplesSeeded,
  getPrinciples,
} from "@/lib/principles/queries";

export default async function PrinciplesPage() {
  await ensurePrinciplesSeeded(prisma);
  const principles = await getPrinciples(prisma);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-10">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Principles
          </h1>
          <p className="mt-2 text-zinc-500">
            Timeless truths that define Hewn Ventures. Not hypotheses—foundations.
          </p>
        </header>

        <div className="space-y-4">
          {principles.map((principle) => (
            <Link
              key={principle.id}
              href={`/principles/${principle.slug}`}
              className="block rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-orange-200 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-zinc-900">
                {principle.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600">
                {principle.description}
              </p>
              <div className="mt-4 flex gap-4 text-xs text-zinc-400">
                <span>{principle._count.researchQuestions} research questions</span>
                <span>{principle._count.thesisLinks} theses</span>
                <span>{principle._count.projectLinks} products</span>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-sm text-zinc-400">
          Principles almost never change. Discovery begins one level down—in{" "}
          <Link href="/research" className="text-orange-600 hover:underline">
            Research Questions
          </Link>
          .
        </p>
      </main>
    </>
  );
}
