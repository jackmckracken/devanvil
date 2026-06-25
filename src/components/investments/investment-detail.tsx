"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InvestmentStatus } from "@/generated/prisma/client";
import { getCategoryMeta, LEVERAGE_LABELS } from "@/lib/investments/categories";

type InvestmentDetailData = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: InvestmentStatus;
  capabilityTarget: string | null;
  intentConnection: string | null;
  leverage: string;
  estimatedHours: number | null;
  compoundingValue: string | null;
  capabilityAdded: string | null;
  reflection: string | null;
  rawInput: string | null;
  projectSlug: string;
  initiatives: { id: string; title: string; recommended: boolean }[];
  enabledWorkItems: {
    id: string;
    title: string;
    status: string;
    relationship: string;
  }[];
};

const STATUS_ACTIONS: Partial<Record<InvestmentStatus, InvestmentStatus>> = {
  captured: "scheduled",
  scheduled: "in_progress",
  in_progress: "completed",
};

export function InvestmentDetail({ investment }: { investment: InvestmentDetailData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [reflection, setReflection] = useState("");

  const category = getCategoryMeta(
    investment.category as Parameters<typeof getCategoryMeta>[0],
  );
  const nextStatus = STATUS_ACTIONS[investment.status];

  async function updateStatus(status: InvestmentStatus, reflectionText?: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/investments/${investment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reflection: reflectionText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Update failed");
      setShowComplete(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  function handleAdvance() {
    if (nextStatus === "completed") {
      setShowComplete(true);
      return;
    }
    if (nextStatus) void updateStatus(nextStatus);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
              Investment · {category.label}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{investment.title}</h1>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            {investment.status.replace(/_/g, " ")}
          </span>
        </div>

        {investment.description && (
          <p className="mt-3 text-zinc-600">{investment.description}</p>
        )}
        {investment.rawInput && (
          <p className="mt-2 text-sm italic text-zinc-400">&ldquo;{investment.rawInput}&rdquo;</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title="Capability Target">
          <p className="text-sm text-emerald-800">
            {investment.capabilityTarget ?? "Not specified"}
          </p>
        </InfoCard>
        <InfoCard title="Leverage">
          <p className="text-sm text-zinc-700">
            {LEVERAGE_LABELS[investment.leverage as keyof typeof LEVERAGE_LABELS]}
          </p>
          {investment.estimatedHours && (
            <p className="mt-1 text-xs text-zinc-400">~{investment.estimatedHours} hours</p>
          )}
        </InfoCard>
        {investment.intentConnection && (
          <InfoCard title="Intent Connection">
            <p className="text-sm text-zinc-700">{investment.intentConnection}</p>
          </InfoCard>
        )}
        {investment.compoundingValue && (
          <InfoCard title="Compounding Value">
            <p className="text-sm text-zinc-700">{investment.compoundingValue}</p>
          </InfoCard>
        )}
      </div>

      {investment.initiatives.length > 0 && (
        <InfoCard title="Related Initiatives">
          <ul className="space-y-1 text-sm">
            {investment.initiatives.map((init) => (
              <li key={init.id}>
                <a href={`/initiatives/${init.id}`} className="text-orange-600 hover:underline">
                  {init.title}
                </a>
                {init.recommended && (
                  <span className="ml-2 text-xs text-zinc-400">recommended</span>
                )}
              </li>
            ))}
          </ul>
        </InfoCard>
      )}

      {investment.capabilityAdded && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-sm font-semibold text-emerald-800">Capability Added</h2>
          <p className="mt-2 text-emerald-900">{investment.capabilityAdded}</p>
          {investment.reflection && investment.reflection !== investment.capabilityAdded && (
            <p className="mt-2 text-sm text-emerald-700">{investment.reflection}</p>
          )}
        </div>
      )}

      {showComplete && (
        <div className="rounded-xl border border-emerald-200 bg-white p-5">
          <h2 className="font-medium text-zinc-900">What new capability do you now have?</h2>
          <p className="mt-1 text-sm text-zinc-500">
            This becomes Architectural Memory — how you grew, not just what you shipped.
          </p>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="I can now build Ableton control surfaces..."
            rows={3}
            className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void updateStatus("completed", reflection)}
              disabled={loading || !reflection.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Complete Investment
            </button>
            <button
              type="button"
              onClick={() => setShowComplete(false)}
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {nextStatus && investment.status !== "completed" && !showComplete && (
        <button
          type="button"
          onClick={handleAdvance}
          disabled={loading}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {loading
            ? "Updating..."
            : nextStatus === "completed"
              ? "Complete & Reflect"
              : `Mark ${nextStatus.replace(/_/g, " ")}`}
        </button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </h3>
      {children}
    </section>
  );
}
