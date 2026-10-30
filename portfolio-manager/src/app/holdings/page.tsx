import { getHoldingsList } from "@/lib/actions";
import { HoldingsTable } from "@/components/HoldingsTable";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { member?: string };
}

export default async function HoldingsPage({ searchParams }: PageProps) {
  const memberId = searchParams?.member;
  const holdings = await getHoldingsList({ memberId });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Consolidated Holdings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time positions across all family members, demat accounts, and physical assets
          </p>
        </div>
      </div>

      <HoldingsTable initialHoldings={holdings} />
    </div>
  );
}
