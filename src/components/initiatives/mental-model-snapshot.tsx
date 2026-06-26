import Link from "next/link";
import type { ArchitectMentalModel } from "@/lib/architect/mental-model-types";
import {
  isRelationshipUnsettled,
  modelDeltaMessage,
  pressuresNeedingAttention,
} from "@/lib/architect/present";

export type MentalModelSnapshotData = {
  thesis: string;
  confidence: number;
  relationships: { label: string; settled: boolean }[];
  risks: string[];
  evolution: string;
};

export function mentalModelToSnapshot(
  model: ArchitectMentalModel,
): MentalModelSnapshotData {
  const childNodes = model.nodes.filter((n) => n.id !== model.rootId);
  const avgConfidence =
    childNodes.length > 0
      ? Math.round(
          childNodes.reduce((sum, n) => sum + n.confidence, 0) / childNodes.length,
        )
      : 75;

  const root = model.nodes.find((n) => n.id === model.rootId);
  const thesis =
    root?.annotation ??
    root?.label ??
    "Investment thesis forming through architectural exploration.";

  const relationships = model.relationships.slice(0, 5).map((r) => ({
    label: `${r.fromLabel} → ${r.toLabel}`,
    settled: !isRelationshipUnsettled(r),
  }));

  const risks = pressuresNeedingAttention(model.pressures ?? []).map(
    (p) => `${p.nodeLabel}: ${p.recommendationDetail || p.label}`,
  );

  if (risks.length === 0 && model.relationships.some(isRelationshipUnsettled)) {
    risks.push("Key relationships still settling");
  }

  return {
    thesis,
    confidence: avgConfidence,
    relationships,
    risks: risks.slice(0, 3),
    evolution: modelDeltaMessage(model),
  };
}

function SummaryCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-4 shadow-sm ${className}`}
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function MentalModelSnapshot({
  snapshot,
  architectSessionId,
}: {
  snapshot: MentalModelSnapshotData;
  architectSessionId?: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Mental Model Snapshot
        </h2>
        {architectSessionId && (
          <Link
            href={`/architect/${architectSessionId}`}
            className="text-xs text-orange-600 hover:underline"
          >
            View full model →
          </Link>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard title="Current Thesis">
          <p className="text-sm leading-relaxed text-zinc-800">{snapshot.thesis}</p>
        </SummaryCard>

        <SummaryCard title="Confidence">
          <p className="text-3xl font-semibold text-zinc-900">{snapshot.confidence}%</p>
        </SummaryCard>

        {snapshot.relationships.length > 0 && (
          <SummaryCard title="Key Relationships">
            <ul className="space-y-1 text-sm text-zinc-700">
              {snapshot.relationships.map((r) => (
                <li key={r.label}>
                  {r.settled ? "✓" : "△"} {r.label}
                </li>
              ))}
            </ul>
          </SummaryCard>
        )}

        {snapshot.risks.length > 0 && (
          <SummaryCard title="Current Risks" className="border-amber-200 bg-amber-50/50">
            <ul className="space-y-1 text-sm text-amber-900">
              {snapshot.risks.map((risk) => (
                <li key={risk}>· {risk}</li>
              ))}
            </ul>
          </SummaryCard>
        )}
      </div>

      <SummaryCard title="Evolution">
        <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-600">
          {snapshot.evolution}
        </p>
      </SummaryCard>
    </section>
  );
}
