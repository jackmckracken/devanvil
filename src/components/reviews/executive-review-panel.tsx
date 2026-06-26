"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ExecutiveReviewSummary } from "@/lib/reviews/executive";
import { EXECUTIVE_REVIEW_QUESTIONS } from "@/lib/reviews/executive";
import { PortfolioHealthPanel } from "@/components/portfolio-health";

type ReviewHistoryItem = {
  id: string;
  periodEnd: Date;
  notes: string | null;
  project: { name: string; slug: string } | null;
};

export function ExecutiveReviewPanel({
  review,
  projectSlug,
  history,
  activeInvestments,
}: {
  review: ExecutiveReviewSummary;
  projectSlug: string;
  history: ReviewHistoryItem[];
  activeInvestments: { id: string; title: string; blockers: string[] }[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");

  async function saveReview() {
    setSaving(true);
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectSlug, notes }),
      });
      setNotes("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Learning This Week
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Research advanced" value={review.researchQuestionsAdvanced} />
          <StatCard label="Theses gained confidence" value={review.thesesGainedConfidence} />
          <StatCard label="New research questions" value={review.newResearchQuestions} />
          <StatCard label="Ideas captured" value={review.newCaptures} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Execution This Week
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Items promoted" value={review.itemsPromoted} />
          <StatCard label="Investments started" value={review.investmentsStarted} />
          <StatCard label="Investments completed" value={review.investmentsCompleted} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Portfolio Health
        </h2>
        <PortfolioHealthPanel health={review.portfolioHealth} />
      </section>

      {review.biggestBlocker && (
        <section className="rounded-xl border border-rose-200 bg-rose-50/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-700">
            Biggest Blocker
          </h2>
          <p className="mt-2 text-base text-rose-900">{review.biggestBlocker}</p>
        </section>
      )}

      <section className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-700">
          Suggested Focus — Next Week
        </h2>
        <p className="mt-2 text-base text-orange-950">{review.suggestedFocus}</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Executive Review Questions
        </h2>
        <ul className="space-y-2">
          {EXECUTIVE_REVIEW_QUESTIONS.map((q) => (
            <li key={q} className="text-sm text-zinc-700">
              · {q}
            </li>
          ))}
        </ul>

        {activeInvestments.map((inv) => (
          <div
            key={inv.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <Link
              href={`/initiatives/${inv.id}`}
              className="font-medium text-zinc-900 hover:text-orange-600"
            >
              {inv.title}
            </Link>
            {inv.blockers.length > 0 && (
              <p className="mt-1 text-xs text-rose-600">
                Blocker: {inv.blockers[0]}
              </p>
            )}
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Record This Review
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What surprised us? Which assumptions were disproven?"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          rows={4}
        />
        <button
          type="button"
          onClick={saveReview}
          disabled={saving}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save to institutional memory"}
        </button>
      </section>

      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Review History
          </h2>
          <ul className="space-y-2">
            {history.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm"
              >
                <p className="font-medium text-zinc-800">
                  {item.periodEnd.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {item.project && ` · ${item.project.name}`}
                </p>
                {item.notes && (
                  <p className="mt-1 text-zinc-600">{item.notes}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
