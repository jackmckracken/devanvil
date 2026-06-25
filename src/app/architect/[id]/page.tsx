import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ArchitectWorkspace } from "@/components/architect/architect-workspace";
import { getArchitectSession } from "@/lib/architect/session";

type PageParams = { params: Promise<{ id: string }> };

export default async function ArchitectSessionPage({ params }: PageParams) {
  const { id } = await params;
  const session = await getArchitectSession(id);
  if (!session) notFound();

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <ArchitectWorkspace initialSession={session} />
      </main>
    </>
  );
}
