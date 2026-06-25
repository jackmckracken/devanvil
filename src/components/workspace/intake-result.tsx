"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ArchitecturalIntakeResult } from "@/lib/workflow/types";

type IntakeResultProps = {
  intakeId: string;
  result: ArchitecturalIntakeResult;
  briefMarkdown: string;
  status: string;
  rawInput: string;
};

export function IntakeResultPanel({
  intakeId,
  result,
  briefMarkdown,
  status,
  rawInput,
}: IntakeResultProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(status === "accepted");
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [investmentId, setInvestmentId] = useState<string | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      const response = await fetch(`/api/workflow/${intakeId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createWorkItems: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Accept failed");
      setAccepted(true);
      setItemIds(data.itemIds ?? []);
      if (data.investmentId) setInvestmentId(data.investmentId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accept failed");
    } finally {
      setAccepting(false);
    }
  }

  const isInvestment = result.command === "investment" && result.investment;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className={`text-xs font-medium uppercase tracking-wide ${isInvestment ? "text-emerald-600" : "text-zinc-400"}`}
            >
              {isInvestment ? "Investment" : result.command.replace(/_/g, " ")}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-900">{result.intent}</h2>
          </div>
          {!accepted && result.command !== "ship" && (
            <button
              type="button"
              onClick={() => void handleAccept()}
              disabled={accepting}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                isInvestment
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {accepting
                ? "Accepting..."
                : isInvestment
                  ? "Capture Investment"
                  : "Accept → Forge"}
            </button>
          )}
          {accepted && (
            <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              Accepted
            </span>
          )}
        </div>

        <p className="mt-3 text-sm text-zinc-500 italic">&ldquo;{rawInput}&rdquo;</p>
      </section>

      {isInvestment && result.investment && (
        <div className="grid gap-4 md:grid-cols-2">
          <ResultCard title="Capability Target">
            <p className="text-sm text-emerald-800">
              {result.investment.classification.capabilityTarget}
            </p>
          </ResultCard>
          <ResultCard title="Category & Leverage">
            <p className="text-sm text-zinc-700">
              {result.investment.categoryLabel} · {result.investment.leverageLabel}
            </p>
            {result.investment.classification.estimatedHours && (
              <p className="mt-1 text-xs text-zinc-400">
                ~{result.investment.classification.estimatedHours} hours
              </p>
            )}
          </ResultCard>
          {result.investment.classification.intentConnection && (
            <ResultCard title="Intent Connection">
              <p className="text-sm text-zinc-700">
                {result.investment.classification.intentConnection}
              </p>
            </ResultCard>
          )}
          <ResultCard title="Compounding Value">
            <p className="text-sm text-zinc-700">
              {result.investment.classification.compoundingValue}
            </p>
          </ResultCard>
          {result.investment.classification.enablesWork.length > 0 && (
            <ResultCard title="May Enable Future Work">
              <ul className="list-inside list-disc text-sm text-zinc-700">
                {result.investment.classification.enablesWork.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </ResultCard>
          )}
        </div>
      )}

      {!isInvestment && (
        <div className="grid gap-4 md:grid-cols-2">
        <ResultCard title="Intent">
          <p className="text-sm text-zinc-700">{result.intent}</p>
          {result.changeCategory && (
            <p className="mt-2 text-xs text-orange-700">
              Change type: <strong>{result.changeCategory}</strong>
            </p>
          )}
        </ResultCard>

        <ResultCard title="Affected Domains">
          {result.domains.length === 0 ? (
            <p className="text-sm text-zinc-400">No protected domains detected</p>
          ) : (
            <ul className="space-y-2">
              {result.domains.map((d) => (
                <li key={d.domain.slug}>
                  <Link
                    href={`/protected-domains/${d.domain.slug}`}
                    className="text-sm font-medium text-orange-600 hover:underline"
                  >
                    {d.domain.name}
                  </Link>
                  <span className="ml-2 text-xs text-zinc-400">
                    {d.domain.protectionLevel} · {d.risk} risk
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ResultCard>

        <ResultCard title="Architectural Memory">
          {result.memory.length === 0 ? (
            <p className="text-sm text-zinc-400">No related memory found</p>
          ) : (
            <ul className="space-y-2">
              {result.memory.slice(0, 4).map((hit) => (
                <li key={`${hit.source}-${hit.id}`}>
                  <Link href={hit.href} className="text-sm text-zinc-800 hover:text-orange-600">
                    {hit.title}
                  </Link>
                  <p className="text-xs text-zinc-400">{hit.snippet}</p>
                </li>
              ))}
            </ul>
          )}
        </ResultCard>

        <ResultCard title="Related Initiatives">
          {result.relatedInitiatives.length === 0 && !result.suggestedInitiative ? (
            <p className="text-sm text-zinc-400">No related initiatives</p>
          ) : (
            <ul className="space-y-2">
              {result.relatedInitiatives.map((init) => (
                <li key={init.id ?? init.title}>
                  {init.id ? (
                    <Link
                      href={`/initiatives/${init.id}`}
                      className="text-sm font-medium text-zinc-800 hover:text-orange-600"
                    >
                      {init.title}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-zinc-800">{init.title}</span>
                  )}
                  <p className="text-xs text-zinc-400">{init.rationale}</p>
                </li>
              ))}
              {result.suggestedInitiative?.isNew && (
                <li className="rounded-lg border border-dashed border-orange-200 bg-orange-50 p-2">
                  <p className="text-sm font-medium text-orange-900">
                    Suggested: {result.suggestedInitiative.title}
                  </p>
                  <p className="text-xs text-orange-700">
                    {result.suggestedInitiative.rationale}
                  </p>
                </li>
              )}
            </ul>
          )}
        </ResultCard>
        </div>
      )}

      {!isInvestment && result.suggestedWorkItems.length > 0 && (
        <ResultCard title="Suggested Work Items">
          <ul className="space-y-3">
            {result.suggestedWorkItems.map((item) => (
              <li key={item.title} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900">{item.title}</span>
                  <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600">
                    {item.itemType}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{item.summary}</p>
                <p className="mt-1 text-xs text-zinc-400">{item.rationale}</p>
              </li>
            ))}
          </ul>
        </ResultCard>
      )}

      {result.investigation && (
        <ResultCard title="Investigation">
          <h3 className="font-medium text-zinc-900">{result.investigation.title}</h3>
          <div className="mt-3">
            <p className="text-xs font-medium uppercase text-zinc-400">Hypotheses</p>
            <ul className="mt-1 list-inside list-disc text-sm text-zinc-700">
              {result.investigation.hypotheses.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium uppercase text-zinc-400">Suggested Steps</p>
            <ul className="mt-1 list-inside list-disc text-sm text-zinc-700">
              {result.investigation.suggestedSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </ResultCard>
      )}

      {result.shipReport && (
        <ResultCard title="Ship Report">
          <p
            className={`text-sm font-medium ${result.shipReport.readyToShip ? "text-green-700" : "text-amber-700"}`}
          >
            {result.shipReport.readyToShip ? "Ready to ship" : "Not ready to ship"}
          </p>
          {result.shipReport.blockers.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-red-600">
              {result.shipReport.blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
          <ul className="mt-3 space-y-1 text-sm text-zinc-700">
            {result.shipReport.gates.map((g) => (
              <li key={g.name}>
                {g.passed ? "✓" : "○"} {g.name}
              </li>
            ))}
          </ul>
        </ResultCard>
      )}

      <ResultCard title="Suggested Next Step">
        <p className="text-sm text-zinc-700">{result.recommendedNextStep}</p>
        {accepted && investmentId && (
          <div className="mt-3">
            <Link
              href={`/investments/${investmentId}`}
              className="rounded-lg bg-emerald-100 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-200"
            >
              View investment →
            </Link>
          </div>
        )}
        {accepted && itemIds.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {itemIds.map((id) => (
              <Link
                key={id}
                href={`/queue/${id}`}
                className="rounded-lg bg-orange-100 px-3 py-1.5 text-sm text-orange-800 hover:bg-orange-200"
              >
                View work item →
              </Link>
            ))}
            <p className="w-full text-xs text-zinc-400">
              Run <code className="rounded bg-zinc-100 px-1">/forge_plan</code> in StudioOps to
              begin development.
            </p>
          </div>
        )}
      </ResultCard>

      <div>
        <button
          type="button"
          onClick={() => setShowBrief(!showBrief)}
          className="text-sm text-orange-600 hover:underline"
        >
          {showBrief ? "Hide" : "Show"}{" "}
          {isInvestment ? "Investment Brief" : "Architectural Brief"}
        </button>
        {showBrief && (
          <pre className="mt-2 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-800 whitespace-pre-wrap">
            {briefMarkdown}
          </pre>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function ResultCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </h3>
      {children}
    </section>
  );
}
