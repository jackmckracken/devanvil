import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { InboxList } from "@/components/inbox/inbox-list";
import { countInboxCaptures, listInboxCaptures } from "@/lib/capture/queries";
import { prisma } from "@/lib/db";

type SearchParams = Promise<{ project?: string }>;

export default async function InboxPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = await searchParams;
  const projectSlug = filters.project ?? "studioops";

  const [projects, captures, inboxCount] = await Promise.all([
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    listInboxCaptures(projectSlug),
    countInboxCaptures(projectSlug),
  ]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">Inbox</h1>
            <p className="mt-1 text-zinc-500">
              Captured ideas waiting for interpretation. {inboxCount} item
              {inboxCount !== 1 ? "s" : ""}.
            </p>
          </div>
          <ProjectSwitcher projects={projects} current={projectSlug} />
        </div>

        <InboxList captures={captures} projectSlug={projectSlug} />
      </main>
    </>
  );
}

function ProjectSwitcher({
  projects,
  current,
}: {
  projects: { slug: string; name: string }[];
  current: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {projects.map((p) => (
        <Link
          key={p.slug}
          href={`/inbox?project=${p.slug}`}
          className={`rounded-full px-3 py-1 text-sm ${
            p.slug === current
              ? "bg-orange-600 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          {p.name}
        </Link>
      ))}
    </div>
  );
}
