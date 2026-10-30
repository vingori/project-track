import { prisma } from "@/lib/prisma";
import { ImportExportCenter } from "@/components/ImportExportCenter";

export const dynamic = "force-dynamic";

export default async function ImportExportPage() {
  const accounts = await prisma.account.findMany({
    include: {
      familyMember: true,
    },
    orderBy: { name: "asc" },
  });

  const recentLogs = await prisma.importLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const holdings = await prisma.holding.findMany({
    include: {
      account: {
        include: {
          familyMember: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const accountOptions = accounts.map((acc) => ({
    id: acc.id,
    name: acc.name,
    broker: acc.broker,
    familyMemberName: acc.familyMember.name,
  }));

  const exportHoldings = holdings.map((h) => {
    const curVal = h.quantity * h.currentPrice;
    const invVal = h.quantity * h.avgBuyPrice;
    const unGain = curVal - invVal;
    const unGainPct = invVal > 0 ? (unGain / invVal) * 100 : 0;

    return {
      symbol: h.symbol,
      name: h.name,
      isin: h.isin,
      assetClass: h.assetClass,
      subCategory: h.subCategory,
      quantity: h.quantity,
      avgBuyPrice: h.avgBuyPrice,
      currentPrice: h.currentPrice,
      currentValue: curVal,
      unrealizedGain: unGain,
      gainPct: unGainPct,
      broker: h.account.broker,
      familyMemberName: h.account.familyMember.name,
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Data Import & Export Center
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Import statements from Zerodha, Groww, Upstox & CAMS CAS or export consolidated Excel/CSV reports
        </p>
      </div>

      <ImportExportCenter
        accounts={accountOptions}
        recentLogs={recentLogs}
        allHoldings={exportHoldings}
      />
    </div>
  );
}
