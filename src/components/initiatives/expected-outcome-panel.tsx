import type { ExpectedOutcome } from "@/lib/initiatives/briefing";

const OUTCOME_LABELS: { key: keyof ExpectedOutcome; label: string }[] = [
  { key: "artistImpact", label: "Artist Impact" },
  { key: "businessImpact", label: "Business Impact" },
  { key: "learningValue", label: "Learning Value" },
  { key: "strategicLeverage", label: "Strategic Leverage" },
  { key: "revenuePotential", label: "Revenue Potential" },
];

function OutcomeBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-600">{label}</span>
        <span className="font-medium text-zinc-800">{value}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function ExpectedOutcomePanel({ outcome }: { outcome: ExpectedOutcome }) {
  return (
    <div className="space-y-3">
      {OUTCOME_LABELS.map(({ key, label }) => (
        <OutcomeBar key={key} label={label} value={outcome[key]} />
      ))}
    </div>
  );
}

// Backward-compatible alias
export { ExpectedOutcomePanel as ExpectedReturnPanel };
