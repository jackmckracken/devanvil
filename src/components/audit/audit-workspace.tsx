"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AuditScope, AuditSessionView } from "@/lib/audit/types";

export function AuditWorkspace({ initialSession }: { initialSession: AuditSessionView }) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scope = session.scope;
  const isActive = session.status === "active";

  async function createPolishInitiative() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/audit/${session.id}/create-initiative`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed");
      router.push(`/initiatives/${data.initiativeId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <Link
          href={`/inbox?project=${session.projectSlug}`}
          className="text-sm text-orange-600 hover:underline"
        >
          ← Inbox
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Audit</h1>
        <p className="text-sm text-zinc-500">
          Evaluate subsystem quality. Group findings into polish themes — not dozens of bugs.
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Source capture · <code className="text-zinc-500">{session.captureId}</code>
        </p>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Original capture
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-800">{session.originalInput}</p>
        </section>

        {scope && <AuditScopePanel scope={scope} />}
      </div>

      <div className="flex flex-wrap gap-3">
        {isActive && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void createPolishInitiative()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Create Polish Initiative
          </button>
        )}
        {session.status === "polish_initiative_created" && session.initiativeId && (
          <Link
            href={`/initiatives/${session.initiativeId}`}
            className="rounded-lg bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800"
          >
            View Polish Initiative →
          </Link>
        )}
      </div>
    </div>
  );
}

function AuditScopePanel({ scope }: { scope: AuditScope }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-1">
      <h2 className="text-lg font-semibold text-zinc-900">{scope.title}</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Target: <span className="font-medium text-zinc-700">{scope.targetSubsystem}</span>
      </p>
      <p className="mt-3 text-sm text-zinc-700">{scope.summary}</p>

      {scope.affectedDomains.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Domains
          </h3>
          <ul className="mt-2 space-y-1">
            {scope.affectedDomains.map((d) => (
              <li key={d.domain.slug} className="text-sm text-zinc-700">
                {d.domain.name}{" "}
                <span className="text-xs text-zinc-400">({d.domain.protectionLevel})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ScopeList title="Scope areas" items={scope.scopeAreas} />
      <ScopeList title="Polish themes (epics)" items={scope.polishThemes} />
      <ScopeList title="Evaluation questions" items={scope.evaluationQuestions} />

      <p className="mt-4 text-sm text-amber-800">{scope.recommendedNextStep}</p>
    </section>
  );
}

function ScopeList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item} className="text-sm text-zinc-700">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
