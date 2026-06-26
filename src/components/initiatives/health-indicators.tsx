import type { InvestmentHealth, HealthLevel } from "@/lib/initiatives/investment-health";

const LEVEL_COLORS: Record<HealthLevel, string> = {
  high: "text-emerald-700 bg-emerald-50 border-emerald-200",
  medium: "text-amber-700 bg-amber-50 border-amber-200",
  low: "text-rose-700 bg-rose-50 border-rose-200",
};

const MOMENTUM_LABELS: Record<HealthLevel, string> = {
  high: "Strong",
  medium: "Moderate",
  low: "Weak",
};

const RISK_LABELS: Record<HealthLevel, string> = {
  high: "Elevated",
  medium: "Moderate",
  low: "Low",
};

function Indicator({
  label,
  value,
  level,
}: {
  label: string;
  value: string | number;
  level?: HealthLevel;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        level ? LEVEL_COLORS[level] : "border-zinc-200 bg-zinc-50 text-zinc-700"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold">
        {typeof value === "number" ? `${value}%` : value}
      </p>
    </div>
  );
}

export function HealthIndicators({ health }: { health: InvestmentHealth }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Indicator label="Momentum" value={MOMENTUM_LABELS[health.momentum]} level={health.momentum} />
      <Indicator label="Confidence" value={health.confidence} />
      <Indicator label="Risk" value={RISK_LABELS[health.risk]} level={health.risk} />
      <Indicator label="Progress" value={health.progress} />
    </div>
  );
}

export function HealthMeta({ health }: { health: InvestmentHealth }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Indicator label="Investment Level" value={health.investmentLevel} />
      <Indicator label="Engineering Cost" value={health.engineeringCost} />
      <Indicator label="Est. User Value" value={health.estimatedUserValue} />
    </div>
  );
}
