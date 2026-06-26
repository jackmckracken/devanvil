import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { prisma } from "@/lib/db";
import { ensurePrinciplesSeeded } from "@/lib/principles/queries";
import { getThesisById } from "@/lib/research/queries";

type RouteContext = { params: Promise<{ id: string }> };

const STATUS_LABELS: Record<string, string> = {
  competing: "Competing",
  leading: "Leading",
  weakened: "Weakened",
  disproven: "Disproven",
  archived: "Archived",
};

const EFFECT_LABELS: Record<string, string> = {
  supports: "Strengthens",
  weakens: "Weakens",
  neutral: "Neutral",
};

export default async function ThesisPage({ params }: RouteContext) {
  await ensurePrinciplesSeeded(prisma);
  const { id } = await params;
  const thesis = await getThesisById(prisma, id);

  if (!thesis) {
    notFound();
  }

  const supporting = thesis.evidenceItems.filter((e) => e.effect === "supports");
  const contradicting = thesis.evidenceItems.filter((e) => e.effect === "weakens");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-10">
        <Link
          href={`/research/${thesis.researchQuestionId}`}
          className="text-sm text-zinc-500 hover:text-orange-600"
        >
          ← {thesis.researchQuestion.question}
        </Link>

        <header className="space-y-3 border-b border-zinc-200 pb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
            Thesis
          </p>
          <h1 className="text-2xl font-semibold leading-relaxed text-zinc-900">
            {thesis.statement}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-orange-50 px-3 py-1 font-medium text-orange-700">
              {thesis.confidence}% confidence
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-600">
              {STATUS_LABELS[thesis.status] ?? thesis.status}
            </span>
          </div>
          {thesis.researchQuestion.principle && (
            <Link
              href={`/principles/${thesis.researchQuestion.principle.slug}`}
              className="text-sm text-orange-600 hover:underline"
            >
              {thesis.researchQuestion.principle.title}
            </Link>
          )}
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <h2 className="text-xs font-semibold uppercase text-emerald-700">
              Supporting Evidence
            </h2>
            {supporting.length === 0 ? (
              <p className="mt-2 text-sm text-emerald-800/60">None yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {supporting.map((e) => (
                  <li key={e.id} className="text-sm text-emerald-900">
                    · {e.title}
                    <span className="ml-1 text-xs text-emerald-700">
                      ({e.source.replace("_", " ")})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
            <h2 className="text-xs font-semibold uppercase text-rose-700">
              Contradicting Evidence
            </h2>
            {contradicting.length === 0 ? (
              <p className="mt-2 text-sm text-rose-800/60">None yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {contradicting.map((e) => (
                  <li key={e.id} className="text-sm text-rose-900">
                    · {e.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {thesis.initiatives.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Investments
            </h2>
            <div className="space-y-2">
              {thesis.initiatives.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/initiatives/${inv.id}`}
                  className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:border-orange-200"
                >
                  <p className="font-medium text-zinc-900">{inv.title}</p>
                  <p className="text-xs text-zinc-400">{inv.status}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {thesis.projectLinks.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Products
            </h2>
            <div className="flex flex-wrap gap-2">
              {thesis.projectLinks.map(({ project }) => (
                <Link
                  key={project.slug}
                  href={`/focus?project=${project.slug}`}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 hover:bg-orange-50"
                >
                  {project.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {thesis.confidenceSnapshots.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Confidence History
            </h2>
            <ul className="space-y-1 text-sm text-zinc-600">
              {thesis.confidenceSnapshots.map((snap) => (
                <li key={snap.id}>
                  {snap.confidence}% — {snap.reason ?? "Updated"}{" "}
                  <span className="text-zinc-400">
                    ({snap.createdAt.toLocaleDateString()})
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
