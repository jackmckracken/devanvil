import Link from "next/link";
import type { ProtectedDomainDetail } from "@/lib/protected-domains/types";
import {
  ProtectionLevelBadge,
  RegressionStatusBadge,
} from "@/components/protected-domain-badges";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">{title}</h2>
      {children}
    </section>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function ProtectedDomainDetailView({
  domain,
}: {
  domain: ProtectedDomainDetail;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold text-zinc-900">{domain.name}</h1>
              <ProtectionLevelBadge level={domain.protectionLevel} />
              <RegressionStatusBadge status={domain.regressionStatus} />
            </div>
            {domain.description ? (
              <p className="mt-2 max-w-3xl text-zinc-600">{domain.description}</p>
            ) : null}
          </div>
          <div className="text-sm text-zinc-600">
            <p>
              <span className="font-medium text-zinc-800">Owner:</span> {domain.owner}
            </p>
            {domain.projectSlug ? (
              <p className="mt-1">
                <span className="font-medium text-zinc-800">Project:</span>{" "}
                {domain.projectSlug}
              </p>
            ) : null}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Last Audit
            </dt>
            <dd className="mt-1 text-sm text-zinc-800">{formatDate(domain.lastAuditAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Last Golden Master
            </dt>
            <dd className="mt-1 text-sm text-zinc-800">
              {formatDate(domain.lastGoldenMasterAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Contract Version
            </dt>
            <dd className="mt-1 text-sm text-zinc-800">{domain.contractVersion ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Inventory Version
            </dt>
            <dd className="mt-1 text-sm text-zinc-800">{domain.inventoryVersion ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <Section title="Overview">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800">Detection Keywords</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {domain.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-800">Path Patterns</h3>
            <ul className="mt-2 space-y-1 text-sm text-zinc-600">
              {domain.pathPatterns.map((pattern) => (
                <li key={pattern} className="font-mono text-xs">
                  {pattern}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Artifacts">
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Kind</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Title</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Path</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Version</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {domain.artifacts.map((artifact) => (
                <tr key={artifact.id}>
                  <td className="px-3 py-2 capitalize text-zinc-600">
                    {artifact.kind.replace(/_/g, " ")}
                  </td>
                  <td className="px-3 py-2 font-medium text-zinc-800">{artifact.title}</td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-600">
                    {artifact.path ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-zinc-600">{artifact.version ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Contracts & Gates">
          <h3 className="mb-2 text-sm font-semibold text-zinc-800">Required Change Gates</h3>
          <ul className="space-y-2">
            {domain.changeGates.map((gate) => (
              <li
                key={gate.id}
                className="flex items-start justify-between rounded-lg border border-zinc-100 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-zinc-800">{gate.name}</p>
                  {gate.description ? (
                    <p className="text-xs text-zinc-500">{gate.description}</p>
                  ) : null}
                </div>
                <span className="text-xs text-zinc-500">
                  {gate.required ? "Required" : "Optional"}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Extension Points">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-emerald-800">Allowed</h3>
              <ul className="mt-2 list-inside list-disc text-sm text-zinc-700">
                {domain.extensionPoints
                  .filter((e) => e.category === "allowed")
                  .map((e) => (
                    <li key={e.id}>{e.name}</li>
                  ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-900">Requires ADR</h3>
              <ul className="mt-2 list-inside list-disc text-sm text-zinc-700">
                {domain.extensionPoints
                  .filter((e) => e.category === "requires_adr")
                  .map((e) => (
                    <li key={e.id}>{e.name}</li>
                  ))}
              </ul>
            </div>
          </div>
        </Section>
      </div>

      <Section title="Recent Changes">
        {domain.changes.length === 0 ? (
          <p className="text-sm text-zinc-600">No recent changes tracked.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {domain.changes.map((change) => (
              <li key={change.id} className="flex items-start justify-between py-3">
                <div>
                  <p className="font-medium text-zinc-800">{change.title}</p>
                  {change.description ? (
                    <p className="text-sm text-zinc-600">{change.description}</p>
                  ) : null}
                  {change.devItemId ? (
                    <Link
                      href={`/queue/${change.devItemId}`}
                      className="mt-1 inline-block text-xs text-orange-700 hover:text-orange-800"
                    >
                      View linked item
                    </Link>
                  ) : null}
                </div>
                <div className="text-right text-xs text-zinc-500">
                  <p className="capitalize">{change.status.replace(/_/g, " ")}</p>
                  {change.risk ? <p className="mt-1">Risk: {change.risk}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Decision History">
          {domain.audits.length === 0 ? (
            <p className="text-sm text-zinc-600">No audits recorded.</p>
          ) : (
            <ul className="space-y-3">
              {domain.audits.map((audit) => (
                <li key={audit.id} className="rounded-lg border border-zinc-100 px-3 py-2">
                  <p className="text-sm text-zinc-800">{audit.note}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatDate(audit.createdAt)}
                    {audit.auditor ? ` · ${audit.auditor}` : ""}
                    {audit.passed ? " · Passed" : " · Failed"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Recent Violations">
          {domain.violations.length === 0 ? (
            <p className="text-sm text-zinc-600">No open violations.</p>
          ) : (
            <ul className="space-y-3">
              {domain.violations.map((violation) => (
                <li
                  key={violation.id}
                  className="rounded-lg border border-red-100 bg-red-50 px-3 py-2"
                >
                  <p className="text-sm text-red-900">{violation.description}</p>
                  <p className="mt-1 text-xs capitalize text-red-700">
                    {violation.severity} · {formatDate(violation.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
