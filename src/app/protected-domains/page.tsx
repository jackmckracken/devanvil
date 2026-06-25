import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { ProtectedDomainsTable } from "@/components/protected-domains-table";
import { prisma } from "@/lib/db";
import { listProtectedDomains } from "@/lib/protected-domains/queries";
import { seedProtectedDomains } from "@/lib/protected-domains/seed";

type SearchParams = Promise<{ project?: string }>;

export default async function ProtectedDomainsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = await searchParams;
  const projectSlug = filters.project ?? "studioops";

  const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
  if (!project) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-zinc-600">Project not found: {projectSlug}</p>
        </main>
      </>
    );
  }

  let domains = await listProtectedDomains(projectSlug);

  if (domains.length === 0) {
    await seedProtectedDomains(prisma, projectSlug);
    domains = await listProtectedDomains(projectSlug);
  }

  const projects = await prisma.project.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">Protected Domains</h1>
            <p className="mt-1 text-zinc-500">
              Architectural boundaries that require governance before modification.
            </p>
          </div>
          <ProjectSwitcher projects={projects} current={projectSlug} />
        </div>

        <ProtectedDomainsTable domains={domains} />
      </main>
    </>
  );
}

function ProjectSwitcher({
  projects,
  current,
}: {
  projects: Array<{ slug: string; name: string }>;
  current: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {projects.map((project) => (
        <Link
          key={project.slug}
          href={`/protected-domains?project=${project.slug}`}
          className={`rounded-full px-3 py-1 text-sm ${
            project.slug === current
              ? "bg-orange-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          }`}
        >
          {project.name}
        </Link>
      ))}
    </div>
  );
}
