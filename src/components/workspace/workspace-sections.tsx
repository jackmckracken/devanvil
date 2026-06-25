import Link from "next/link";
import type { getPortfolioFocus } from "@/lib/initiatives/ready-items";

type RecentIntake = {
  id: string;
  command: string;
  intent: string | null;
  rawInput: string;
  status: string;
  createdAt: Date;
};

type WorkspaceSectionsProps = {
  projectSlug: string;
  recentIntakes: RecentIntake[];
  readyItems: Awaited<ReturnType<typeof getPortfolioFocus>>["readyItems"];
  recentInvestigations: RecentIntake[];
  domainCount: number;
};

export function WorkspaceSections({
  projectSlug,
  recentIntakes,
  readyItems,
  recentInvestigations,
  domainCount,
}: WorkspaceSectionsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Section title="Recent Architectural Intakes" href={`/workspace?project=${projectSlug}`}>
        {recentIntakes.length === 0 ? (
          <EmptyState>No intakes yet. Start with an idea above.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {recentIntakes.map((intake) => (
              <li key={intake.id}>
                <Link
                  href={`/workspace/${intake.id}`}
                  className="block rounded-lg p-2 hover:bg-zinc-50"
                >
                  <p className="text-sm font-medium text-zinc-900 line-clamp-1">
                    {intake.intent ?? intake.rawInput}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {intake.command.replace(/_/g, " ")} · {formatRelative(intake.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Ready for Planning" href={`/focus?project=${projectSlug}`}>
        {readyItems.length === 0 ? (
          <EmptyState>Nothing ready. Complete an intake first.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {readyItems.slice(0, 5).map((item) => (
              <li key={item.id}>
                <Link
                  href={`/queue/${item.id}`}
                  className="block rounded-lg p-2 hover:bg-zinc-50"
                >
                  <p className="text-sm font-medium text-zinc-900 line-clamp-1">
                    {item.title}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {item.initiative?.title ?? "Unassigned"} · score {item.score}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Protected Domains" href={`/protected-domains?project=${projectSlug}`}>
        <p className="text-sm text-zinc-600">
          {domainCount} architectural domain{domainCount !== 1 ? "s" : ""} registered
        </p>
        <Link
          href={`/protected-domains?project=${projectSlug}`}
          className="mt-2 inline-block text-sm text-orange-600 hover:underline"
        >
          Browse domains →
        </Link>
      </Section>

      <Section title="Recent Investigations" href={`/workspace?project=${projectSlug}`}>
        {recentInvestigations.length === 0 ? (
          <EmptyState>No investigations yet.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {recentInvestigations.map((inv) => (
              <li key={inv.id}>
                <Link
                  href={`/workspace/${inv.id}`}
                  className="block rounded-lg p-2 hover:bg-zinc-50"
                >
                  <p className="text-sm font-medium text-zinc-900 line-clamp-1">
                    {inv.intent ?? inv.rawInput}
                  </p>
                  <p className="text-xs text-zinc-400">{formatRelative(inv.createdAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Architectural Memory" href={`/memory?project=${projectSlug}`}>
        <p className="text-sm text-zinc-600">
          Search past conversations, decisions, and domain history.
        </p>
        <Link
          href={`/memory?project=${projectSlug}`}
          className="mt-2 inline-block text-sm text-orange-600 hover:underline"
        >
          Search memory →
        </Link>
      </Section>

      <Section title="Investments" href={`/investments?project=${projectSlug}`}>
        <p className="text-sm text-zinc-600">
          Capability-building work — learning, experimentation, environment.
        </p>
        <Link
          href={`/investments?project=${projectSlug}`}
          className="mt-2 inline-block text-sm text-emerald-600 hover:underline"
        >
          View portfolio →
        </Link>
      </Section>

      <Section title="Forge Activity" href={`/queue?project=${projectSlug}&status=in_build`}>
        <p className="text-sm text-zinc-600">
          Items currently in build appear here when Forge is active.
        </p>
        <Link
          href={`/queue?project=${projectSlug}&status=in_build`}
          className="mt-2 inline-block text-sm text-orange-600 hover:underline"
        >
          View build queue →
        </Link>
      </Section>
    </div>
  );
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        <Link href={href} className="text-xs text-zinc-400 hover:text-orange-600">
          →
        </Link>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-400">{children}</p>;
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
