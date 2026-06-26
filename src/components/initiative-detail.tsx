"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { ExpectedOutcomePanel } from "@/components/initiatives/expected-outcome-panel";
import {
  HealthIndicators,
  HealthMeta,
} from "@/components/initiatives/health-indicators";
import {
  MentalModelSnapshot,
  type MentalModelSnapshotData,
} from "@/components/initiatives/mental-model-snapshot";
import { WorkConstellation } from "@/components/initiatives/work-constellation";
import {
  InitiativePriorityBadge,
  InitiativeStatusBadge,
  StrategicValueBadge,
} from "@/components/initiative-badges";
import type {
  InitiativePriority,
  InitiativeStatus,
  StrategicValue,
} from "@/generated/prisma/client";
import type { InitiativeBriefing } from "@/lib/initiatives/briefing";
import type { InvestmentHealth } from "@/lib/initiatives/investment-health";
import {
  INITIATIVE_PRIORITY_LABELS,
  INITIATIVE_STATUS_LABELS,
  STRATEGIC_VALUE_LABELS,
} from "@/lib/initiatives/types";

type WorkItem = {
  id: string;
  title: string;
  status: string;
  itemType: string;
};

type InitiativeDetailProps = {
  initiative: {
    id: string;
    title: string;
    description: string | null;
    status: InitiativeStatus;
    priority: InitiativePriority;
    strategicValue: StrategicValue;
    targetRelease: string | null;
    scoreOverride: number | null;
    project: { name: string; slug: string };
    briefing: InitiativeBriefing;
    health: InvestmentHealth;
    mentalModelSnapshot: MentalModelSnapshotData | null;
    architectSessionId: string | null;
    readyItems: WorkItem[];
    shippedItems: WorkItem[];
    blockedItems: WorkItem[];
    otherItems: WorkItem[];
    blockers: string[];
    dependencies: string[];
    thesis: { id: string; statement: string; researchQuestion: string } | null;
  };
};

export function InitiativeDetail({ initiative }: InitiativeDetailProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  async function updateField(field: string, value: string | number | null) {
    setSaving(true);
    try {
      await fetch(`/api/initiatives/${initiative.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-10">
        <Link
          href={`/focus?project=${initiative.project.slug}`}
          className="text-sm text-zinc-500 hover:text-orange-600"
        >
          ← Engineering Portfolio
        </Link>

        {/* Section 1: Title & Thesis */}
        <header className="space-y-3 border-b border-zinc-200 pb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
            Engineering Investment
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
            {initiative.title}
          </h1>
          <p className="text-lg leading-relaxed text-zinc-600">
            {initiative.briefing.thesis}
          </p>
          {initiative.thesis && (
            <p className="text-sm text-zinc-500">
              Thesis:{" "}
              <Link
                href={`/theses/${initiative.thesis.id}`}
                className="text-orange-600 hover:underline"
              >
                {initiative.thesis.statement}
              </Link>
            </p>
          )}
          <p className="text-sm text-zinc-400">{initiative.project.name}</p>
        </header>

        {/* Section 2: Why this investment exists */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Why this investment exists
          </h2>
          <p className="text-sm text-zinc-500">
            What outcome are we buying?
          </p>
          <ul className="space-y-2">
            {initiative.briefing.outcomes.map((outcome) => (
              <li
                key={outcome}
                className="flex items-start gap-2 text-base text-zinc-800"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                {outcome}
              </li>
            ))}
          </ul>
        </section>

        {/* Section 3: Expected Outcome */}
        <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Expected Outcome
          </h2>
          <ExpectedOutcomePanel outcome={initiative.briefing.expectedOutcome} />
        </section>

        {/* Section 4: Current Reality */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Current Reality
          </h2>
          <HealthIndicators health={initiative.health} />

          {(initiative.blockers.length > 0 || initiative.dependencies.length > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {initiative.blockers.length > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                  <h3 className="text-xs font-semibold uppercase text-rose-700">
                    Blockers
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-rose-900">
                    {initiative.blockers.map((b) => (
                      <li key={b}>· {b}</li>
                    ))}
                  </ul>
                </div>
              )}
              {initiative.dependencies.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                  <h3 className="text-xs font-semibold uppercase text-amber-700">
                    Dependencies
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-amber-900">
                    {initiative.dependencies.map((d) => (
                      <li key={d}>· {d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <HealthMeta health={initiative.health} />

          <button
            type="button"
            onClick={() => setShowMetadata(!showMetadata)}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            {showMetadata ? "Hide metadata ▲" : "Show metadata ▼"}
          </button>

          {showMetadata && (
            <div className="grid gap-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4 sm:grid-cols-2">
              <FieldSelect
                label="Status"
                value={initiative.status}
                options={INITIATIVE_STATUS_LABELS}
                onChange={(v) => updateField("status", v)}
                disabled={saving}
              />
              <FieldSelect
                label="Priority"
                value={initiative.priority}
                options={INITIATIVE_PRIORITY_LABELS}
                onChange={(v) => updateField("priority", v)}
                disabled={saving}
              />
              <FieldSelect
                label="Strategic Value"
                value={initiative.strategicValue}
                options={STRATEGIC_VALUE_LABELS}
                onChange={(v) => updateField("strategicValue", v)}
                disabled={saving}
              />
              <div>
                <label className="block text-xs font-medium uppercase text-zinc-500">
                  Score Override (0–100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={initiative.scoreOverride ?? ""}
                  placeholder="Auto"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  onBlur={(e) => {
                    const val = e.target.value === "" ? null : Number(e.target.value);
                    updateField("scoreOverride", val);
                  }}
                  disabled={saving}
                />
              </div>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <InitiativeStatusBadge status={initiative.status} />
                <InitiativePriorityBadge priority={initiative.priority} />
                <StrategicValueBadge value={initiative.strategicValue} />
                {initiative.targetRelease && (
                  <span className="text-xs text-zinc-500">
                    Target: {initiative.targetRelease}
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Mental Model Snapshot */}
        {initiative.mentalModelSnapshot && (
          <MentalModelSnapshot
            snapshot={initiative.mentalModelSnapshot}
            architectSessionId={initiative.architectSessionId ?? undefined}
          />
        )}

        {/* Section 5: Linked Work */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Linked Work
          </h2>
          <WorkConstellation
            initiativeTitle={initiative.title}
            readyItems={initiative.readyItems}
            shippedItems={initiative.shippedItems}
            blockedItems={initiative.blockedItems}
            otherItems={initiative.otherItems}
          />
        </section>
      </main>
    </>
  );
}

function FieldSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase text-zinc-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
      >
        {Object.entries(options).map(([key, label]) => (
          <option key={key} value={key}>
            {label as string}
          </option>
        ))}
      </select>
    </div>
  );
}
