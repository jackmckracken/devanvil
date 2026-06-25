import type { ArchitectAnalysis } from "@/lib/architect/types";

export function ArchitectDesignReview({ analysis }: { analysis: ArchitectAnalysis }) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-600">
          Architect&apos;s Current Understanding
        </h3>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
          {analysis.currentUnderstanding}
        </p>
      </section>

      <ConfidenceBar confidence={analysis.confidence} />

      {analysis.decisionsLocked.length > 0 && (
        <CheckList title="Decisions Locked" items={analysis.decisionsLocked} symbol="✓" />
      )}

      {analysis.assumptions.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Assumptions
          </h3>
          <ul className="mt-2 space-y-1.5">
            {analysis.assumptions.map((a) => (
              <li key={a.text} className="flex gap-2 text-sm text-zinc-700">
                <span
                  className={
                    a.status === "locked"
                      ? "font-medium text-emerald-600"
                      : "font-medium text-amber-500"
                  }
                >
                  {a.status === "locked" ? "✓" : "?"}
                </span>
                <span>{a.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {analysis.strongOpinions.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Strong Opinions
          </h3>
          <ul className="mt-2 space-y-2">
            {analysis.strongOpinions.map((opinion) => (
              <li
                key={opinion}
                className="rounded-lg border border-violet-100 bg-violet-50/50 px-3 py-2 text-sm text-violet-900"
              >
                {opinion}
              </li>
            ))}
          </ul>
        </section>
      )}

      {analysis.architecturalRisks.length > 0 && (
        <BulletList title="Architectural Risks" items={analysis.architecturalRisks} tone="risk" />
      )}

      {analysis.remainingUnknowns.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Architectural Observations
          </h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-zinc-700">
            {analysis.remainingUnknowns.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </section>
      )}

      {analysis.potentialConcepts.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Emerging Concepts
          </h3>
          <div className="mt-2 space-y-2">
            {analysis.potentialConcepts.map((c) => (
              <div
                key={c.name}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-900">{c.name}</span>
                  <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600">
                    {c.confidence}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-600">{c.reasoning}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const tone =
    confidence >= 80 ? "bg-emerald-500" : confidence >= 60 ? "bg-amber-500" : "bg-zinc-400";

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Confidence</h3>
        <span className="text-2xl font-semibold tabular-nums text-zinc-900">{confidence}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${confidence}%` }} />
      </div>
    </section>
  );
}

function CheckList({
  title,
  items,
  symbol,
}: {
  title: string;
  items: string[];
  symbol: string;
}) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</h3>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-zinc-700">
            <span className="text-emerald-600">{symbol}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BulletList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: "risk";
}) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</h3>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li
            key={item}
            className={`text-sm ${tone === "risk" ? "text-amber-900" : "text-zinc-700"}`}
          >
            • {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
