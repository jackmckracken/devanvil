import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AuditWorkspace } from "@/components/audit/audit-workspace";
import { getAuditSession } from "@/lib/audit/session";

type PageParams = { params: Promise<{ id: string }> };

export default async function AuditSessionPage({ params }: PageParams) {
  const { id } = await params;
  const session = await getAuditSession(id);
  if (!session) notFound();

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <AuditWorkspace initialSession={session} />
      </main>
    </>
  );
}
