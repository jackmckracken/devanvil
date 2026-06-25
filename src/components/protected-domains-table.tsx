import Link from "next/link";
import type { ProtectedDomainSummary } from "@/lib/protected-domains/types";
import {
  ProtectionLevelBadge,
  RegressionStatusBadge,
} from "@/components/protected-domain-badges";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export function ProtectedDomainsTable({
  domains,
}: {
  domains: ProtectedDomainSummary[];
}) {
  if (domains.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-zinc-600">
        No protected domains registered yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Name</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Protection</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Owner</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Last Audit</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Golden Master</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Contract</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Inventory</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Regression</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Open</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Violations</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {domains.map((domain) => (
            <tr key={domain.id} className="hover:bg-zinc-50">
              <td className="px-4 py-3">
                <Link
                  href={`/protected-domains/${domain.slug}`}
                  className="font-medium text-orange-700 hover:text-orange-800"
                >
                  {domain.name}
                </Link>
                {domain.description ? (
                  <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                    {domain.description}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <ProtectionLevelBadge level={domain.protectionLevel} />
              </td>
              <td className="px-4 py-3 text-zinc-700">{domain.owner}</td>
              <td className="px-4 py-3 text-zinc-600">{formatDate(domain.lastAuditAt)}</td>
              <td className="px-4 py-3 text-zinc-600">
                {formatDate(domain.lastGoldenMasterAt)}
              </td>
              <td className="px-4 py-3 text-zinc-600">{domain.contractVersion ?? "—"}</td>
              <td className="px-4 py-3 text-zinc-600">{domain.inventoryVersion ?? "—"}</td>
              <td className="px-4 py-3">
                <RegressionStatusBadge status={domain.regressionStatus} />
              </td>
              <td className="px-4 py-3 text-zinc-700">{domain.openChanges}</td>
              <td className="px-4 py-3 text-zinc-700">{domain.recentViolations}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
