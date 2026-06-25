import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { InvestmentDetail } from "@/components/investments/investment-detail";
import { getInvestmentById } from "@/lib/investments/queries";

type PageParams = { params: Promise<{ id: string }> };

export default async function InvestmentDetailPage({ params }: PageParams) {
  const { id } = await params;
  const investment = await getInvestmentById(id);
  if (!investment) notFound();

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Link
          href={`/investments?project=${investment.projectSlug}`}
          className="text-sm text-orange-600 hover:underline"
        >
          ← Investments
        </Link>
        <InvestmentDetail investment={investment} />
      </main>
    </>
  );
}
