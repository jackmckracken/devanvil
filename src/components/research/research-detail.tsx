"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import type { BrainstormResult } from "@/lib/research/brainstorm";

type ResearchDetailProps = {
  question: {
    id: string;
    question: string;
    whyItMatters: string | null;
    currentUnderstanding: string | null;
    unknowns: string[];
    status: string;
    nextExperiment: string | null;
    brainstormJson: BrainstormResult | null;
    principle: { title: string; slug: string } | null;
    theses: {
      id: string;
      statement: string;
      confidence: number;
      status: string;
      evidenceItems: {
        id: string;
        title: string;
        effect: string;
        source: string;
      }[];
      initiatives: { id: string; title: string; status: string }[];
    }[];
    researchNotes: {
      id: string;
      kind: string;
      title: string;
      url: string | null;
      excerpt: string | null;
    }[];
  };
};

export function ResearchDetail({ question }: ResearchDetailProps) {
  const router = useRouter();
  const [brainstorming, setBrainstorming] = useState(false);
  const [brainstorm, setBrainstorm] = useState<BrainstormResult | null>(
    question.brainstormJson,
  );

  async function runBrainstorm() {
    setBrainstorming(true);
    try {
      const res = await fetch(`/api/research/${question.id}/brainstorm`, {
        method: "POST",
      });
      const data = await res.json();
      setBrainstorm(data);
      router.refresh();
    } finally {
      setBrainstorming(false);
    }
  }

  const unknowns = question.unknowns;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-10">
        <Link href="/research" className="text-sm text-zinc-500 hover:text-orange-600">
          ← Research Questions
        </Link>

        <header className="space-y-3 border-b border-zinc-200 pb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
            Research Question
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {question.question}
          </h1>
          {question.principle && (
            <Link
              href={`/principles/${question.principle.slug}`}
              className="text-sm text-orange-600 hover:underline"
            >
              {question.principle.title}
            </Link>
          )}
        </header>

        {question.whyItMatters && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Why This Matters
            </h2>
            <p className="text-base leading-relaxed text-zinc-700">
              {question.whyItMatters}
            </p>
          </section>
        )}

        {question.currentUnderstanding && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Current Understanding
            </h2>
            <p className="text-base leading-relaxed text-zinc-700">
              {question.currentUnderstanding}
            </p>
          </section>
        )}

        {unknowns.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Unknowns
            </h2>
            <ul className="space-y-1 text-sm text-zinc-700">
              {unknowns.map((u) => (
                <li key={u}>· {u}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Competing Theses
            </h2>
            <button
              type="button"
              onClick={runBrainstorm}
              disabled={brainstorming}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {brainstorming ? "Brainstorming…" : "Brainstorm"}
            </button>
          </div>
          <div className="space-y-3">
            {question.theses.map((thesis) => (
              <Link
                key={thesis.id}
                href={`/theses/${thesis.id}`}
                className={`block rounded-xl border p-4 shadow-sm transition hover:border-orange-200 ${
                  thesis.status === "leading"
                    ? "border-orange-300 bg-orange-50/50"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-zinc-800">{thesis.statement}</p>
                  <span className="shrink-0 text-sm font-semibold text-zinc-600">
                    {thesis.confidence}%
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  {thesis.status} · {thesis.evidenceItems.length} evidence ·{" "}
                  {thesis.initiatives.length} investments
                </p>
              </Link>
            ))}
          </div>
        </section>

        {brainstorm && (
          <section className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/30 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-700">
              Brainstorm Results
            </h2>
            {brainstorm.themes.map((theme) => (
              <div key={theme.label}>
                <p className="text-xs font-semibold uppercase text-zinc-500">
                  {theme.label}
                </p>
                <ul className="mt-1 space-y-0.5 text-sm text-zinc-700">
                  {theme.explanations.map((e) => (
                    <li key={e}>· {e}</li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <p className="text-xs font-semibold uppercase text-zinc-500">
                Suggested Experiments
              </p>
              <ul className="mt-1 space-y-0.5 text-sm text-zinc-700">
                {brainstorm.suggestedExperiments.map((e) => (
                  <li key={e}>· {e}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {question.researchNotes.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Research
            </h2>
            <ul className="space-y-2">
              {question.researchNotes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm"
                >
                  <span className="text-xs uppercase text-zinc-400">{note.kind}</span>
                  <p className="font-medium text-zinc-800">{note.title}</p>
                  {note.excerpt && (
                    <p className="mt-1 text-zinc-600">{note.excerpt}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {question.nextExperiment && (
          <section className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Next Experiment
            </h2>
            <p className="mt-2 text-sm text-zinc-700">{question.nextExperiment}</p>
          </section>
        )}
      </main>
    </>
  );
}
