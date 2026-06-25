import { notFound } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { ProtectedDomainDetailView } from "@/components/protected-domain-detail";
import { getProtectedDomainBySlug } from "@/lib/protected-domains/queries";

type RouteContext = { params: Promise<{ slug: string }> };

export default async function ProtectedDomainPage({ params }: RouteContext) {
  const { slug } = await params;
  const domain = await getProtectedDomainBySlug(slug);

  if (!domain) {
    notFound();
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-8">
        <Link
          href={`/protected-domains${domain.projectSlug ? `?project=${domain.projectSlug}` : ""}`}
          className="text-sm text-orange-700 hover:text-orange-800"
        >
          ← Back to Protected Domains
        </Link>
        <ProtectedDomainDetailView domain={domain} />
      </main>
    </>
  );
}
