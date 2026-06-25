import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { IntakeResultPanel } from "@/components/workspace/intake-result";
import { prisma } from "@/lib/db";
import type { ArchitecturalIntakeResult } from "@/lib/workflow/types";

type PageParams = { params: Promise<{ id: string }> };

export default async function IntakeDetailPage({ params }: PageParams) {
  const { id } = await params;

  const intake = await prisma.architecturalIntake.findUnique({
    where: { id },
    include: { project: { select: { slug: true, name: true } } },
  });

  if (!intake) notFound();

  const result = intake.resultJson as ArchitecturalIntakeResult | null;
  if (!result || !intake.briefMarkdown) notFound();

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div>
          <Link
            href={`/workspace?project=${intake.project.slug}`}
            className="text-sm text-orange-600 hover:underline"
          >
            ← Workspace
          </Link>
          <p className="mt-2 text-xs text-zinc-400">
            {intake.project.name} · {new Date(intake.createdAt).toLocaleString()}
          </p>
        </div>

        <IntakeResultPanel
          intakeId={intake.id}
          result={result}
          briefMarkdown={intake.briefMarkdown}
          status={intake.status}
          rawInput={intake.rawInput}
        />
      </main>
    </>
  );
}
