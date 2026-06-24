"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import {
  InitiativePriorityBadge,
  InitiativeStatusBadge,
  ScoreBadge,
  StrategicValueBadge,
} from "@/components/initiative-badges";
import { StatusBadge, TypeBadge } from "@/components/badges";
import type {
  InitiativePriority,
  InitiativeStatus,
  StrategicValue,
} from "@/generated/prisma/client";
import {
  INITIATIVE_PRIORITY_LABELS,
  INITIATIVE_STATUS_LABELS,
  STRATEGIC_VALUE_LABELS,
} from "@/lib/initiatives/types";

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
    priorityScore: number;
    blockers: string[];
    dependencies: string[];
    itemCountsByStatus: Record<string, number>;
    project: { name: string; slug: string };
    readyItems: {
      id: string;
      title: string;
      status: string;
      itemType: string;
      priority: string;
    }[];
    shippedItems: {
      id: string;
      title: string;
      status: string;
      itemType: string;
      priority: string;
    }[];
    items: {
      devItem: {
        id: string;
        title: string;
        status: string;
        itemType: string;
        priority: string;
      };
    }[];
  };
};

export function InitiativeDetail({ initiative }: InitiativeDetailProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

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
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div>
          <Link
            href={`/focus?project=${initiative.project.slug}`}
            className="text-sm text-orange-600 hover:underline"
          >
            ← Back to Focus
          </Link>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="text-3xl font-semibold text-zinc-900">{initiative.title}</h1>
            <ScoreBadge
              score={initiative.priorityScore}
              overridden={initiative.scoreOverride !== null}
            />
          </div>
          {initiative.description && (
            <p className="mt-2 text-zinc-600">{initiative.description}</p>
          )}
          <p className="mt-1 text-sm text-zinc-500">{initiative.project.name}</p>
        </div>

        <div className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:grid-cols-2">
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
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              onBlur={(e) => {
                const val = e.target.value === "" ? null : Number(e.target.value);
                updateField("scoreOverride", val);
              }}
              disabled={saving}
            />
            <p className="mt-1 text-xs text-zinc-400">User override always wins</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <InitiativeStatusBadge status={initiative.status} />
          <InitiativePriorityBadge priority={initiative.priority} />
          <StrategicValueBadge value={initiative.strategicValue} />
        </div>

        {(initiative.blockers.length > 0 || initiative.dependencies.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {initiative.blockers.length > 0 && (
              <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <h2 className="text-sm font-semibold text-rose-900">Blockers</h2>
                <ul className="mt-2 space-y-1 text-sm text-rose-800">
                  {initiative.blockers.map((blocker) => (
                    <li key={blocker}>· {blocker}</li>
                  ))}
                </ul>
              </section>
            )}
            {initiative.dependencies.length > 0 && (
              <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h2 className="text-sm font-semibold text-amber-900">Dependencies</h2>
                <ul className="mt-2 space-y-1 text-sm text-amber-800">
                  {initiative.dependencies.map((dep) => (
                    <li key={dep}>· {dep}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Item counts by status</h2>
          <dl className="mt-2 flex flex-wrap gap-3 text-sm">
            {Object.entries(initiative.itemCountsByStatus).map(([status, count]) => (
              <div key={status} className="rounded-lg bg-zinc-50 px-3 py-2">
                <dt className="text-xs uppercase text-zinc-500">{status.replace("_", " ")}</dt>
                <dd className="font-semibold text-zinc-900">{count}</dd>
              </div>
            ))}
          </dl>
        </section>

        {initiative.readyItems.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-900">
              Ready Items ({initiative.readyItems.length})
            </h2>
            <ItemList items={initiative.readyItems} />
          </section>
        )}

        {initiative.shippedItems.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-900">
              Shipped ({initiative.shippedItems.length})
            </h2>
            <ItemList items={initiative.shippedItems} />
          </section>
        )}

        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">
            Linked Items ({initiative.items.length})
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-zinc-100">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {initiative.items.map(({ devItem }) => (
                  <tr key={devItem.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/queue/${devItem.id}`}
                        className="text-sm font-medium text-zinc-900 hover:text-orange-600"
                      >
                        {devItem.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={devItem.itemType as "feature"} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={devItem.status as "captured"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {initiative.items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-zinc-500">
                No items linked yet. Promote a cluster from Curation or link items via API.
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function ItemList({
  items,
}: {
  items: {
    id: string;
    title: string;
    status: string;
    itemType: string;
    priority: string;
  }[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-100">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
              Title
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {items.map((devItem) => (
            <tr key={devItem.id} className="hover:bg-zinc-50">
              <td className="px-4 py-3">
                <Link
                  href={`/queue/${devItem.id}`}
                  className="text-sm font-medium text-zinc-900 hover:text-orange-600"
                >
                  {devItem.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                <TypeBadge type={devItem.itemType as "feature"} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={devItem.status as "captured"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
      <label className="block text-xs font-medium uppercase text-zinc-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
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
