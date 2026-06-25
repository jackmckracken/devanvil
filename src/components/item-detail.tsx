"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DevItemStatus } from "@/generated/prisma/client";
import { PriorityBadge, StatusBadge, TypeBadge } from "@/components/badges";
import { TRIAGE_ACTIONS } from "@/lib/types";

type ItemDetailData = {
  id: string;
  title: string;
  rawText: string;
  normalizedSummary: string;
  itemType: string;
  status: DevItemStatus;
  priority: string;
  sourceType: string;
  confidenceScore: number | null;
  suggestedBranchName: string | null;
  suggestedCommand: string | null;
  createdAt: string;
  sourceCaptureId: string | null;
  sourceCapture: { id: string; rawText: string } | null;
  acceptanceCriteria: string | null;
  project: { name: string; slug: string };
  duplicateOf: { id: string; title: string; status: string } | null;
  matches: {
    id: string;
    similarityScore: number;
    matchReason: string;
    matchedItem: {
      id: string;
      title: string;
      status: string;
      project: { name: string };
    };
  }[];
  activity: {
    id: string;
    action: string;
    note: string | null;
    createdAt: string;
  }[];
};

const actionLabels: Record<DevItemStatus, string> = {
  captured: "Captured",
  triaged: "Mark Triaged",
  approved: "Approve",
  in_build: "In Build",
  shipped: "Shipped",
  duplicate: "Mark Duplicate",
  rejected: "Reject",
  archived: "Archive",
};

export function ItemDetail({ item }: { item: ItemDetailData }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: DevItemStatus) {
    setLoading(status);
    setError(null);

    const response = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        note: `Status changed to ${status}`,
        ...(status === "duplicate" && item.matches[0]
          ? { duplicateOfId: item.matches[0].matchedItem.id }
          : {}),
      }),
    });

    setLoading(null);

    if (!response.ok) {
      setError("Failed to update item");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/queue" className="text-sm text-orange-700 hover:underline">
            ← Back to queue
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-900">{item.title}</h1>
          {item.sourceCapture && (
            <p className="mt-2 text-sm text-zinc-500">
              From capture:{" "}
              <span className="text-zinc-700 line-clamp-1">{item.sourceCapture.rawText}</span>
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={item.status} />
            <TypeBadge type={item.itemType as never} />
            <PriorityBadge priority={item.priority as never} />
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
              {item.project.name}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Raw Text
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-zinc-800">{item.rawText}</p>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Summary
            </h2>
            <p className="mt-3 text-zinc-800">{item.normalizedSummary}</p>
          </section>

          {item.acceptanceCriteria && (
            <section className="rounded-xl border border-red-100 bg-red-50/40 p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-red-700">
                Acceptance Criteria
              </h2>
              <pre className="mt-3 whitespace-pre-wrap text-sm text-zinc-800">
                {item.acceptanceCriteria.replace(/^Acceptance criteria:\n\n/, "")}
              </pre>
            </section>
          )}

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Duplicate & Related Matches
            </h2>
            {item.duplicateOf ? (
              <p className="mt-3 text-sm text-orange-800">
                Marked duplicate of{" "}
                <Link
                  href={`/queue/${item.duplicateOf.id}`}
                  className="font-medium underline"
                >
                  {item.duplicateOf.title}
                </Link>
              </p>
            ) : null}
            {item.matches.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No related items found.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {item.matches.map((match) => (
                  <li
                    key={match.id}
                    className="rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/queue/${match.matchedItem.id}`}
                        className="font-medium text-zinc-900 hover:text-orange-700"
                      >
                        {match.matchedItem.title}
                      </Link>
                      <span className="text-xs text-zinc-500">
                        {(match.similarityScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {match.matchedItem.project.name} · {match.matchReason}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Activity Log
            </h2>
            <ul className="mt-3 space-y-2">
              {item.activity.map((entry) => (
                <li key={entry.id} className="border-b border-zinc-100 pb-2 text-sm">
                  <span className="font-medium text-zinc-800">{entry.action}</span>
                  {entry.note ? (
                    <span className="text-zinc-600"> — {entry.note}</span>
                  ) : null}
                  <div className="text-xs text-zinc-400">
                    {new Date(entry.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Classification
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Source</dt>
                <dd className="text-zinc-800">{item.sourceType}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Confidence</dt>
                <dd className="text-zinc-800">
                  {item.confidenceScore
                    ? `${(item.confidenceScore * 100).toFixed(0)}%`
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Captured</dt>
                <dd className="text-zinc-800">
                  {new Date(item.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Suggested Implementation
            </h2>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <p className="text-zinc-500">Branch</p>
                <code className="mt-1 block rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-800">
                  {item.suggestedBranchName ?? "—"}
                </code>
              </div>
              <div>
                <p className="text-zinc-500">Command</p>
                <code className="mt-1 block rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-800">
                  {item.suggestedCommand ?? "—"}
                </code>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Triage Actions
            </h2>
            <div className="mt-3 grid gap-2">
              {TRIAGE_ACTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={loading !== null || item.status === status}
                  onClick={() => updateStatus(status)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading === status ? "Updating..." : actionLabels[status]}
                </button>
              ))}
            </div>
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          </section>
        </div>
      </div>
    </div>
  );
}
