import { prisma } from "@/lib/prisma";
import { formatINR, formatPercent } from "@/lib/formatters";
import { Building2, Home, Landmark, Key, TrendingUp, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { member?: string };
}

export default async function RealEstatePage({ searchParams }: PageProps) {
  const memberId = searchParams?.member;
  const memberFilter = memberId && memberId !== "ALL"
    ? { account: { familyMemberId: memberId } }
    : {};

  const properties = await prisma.holding.findMany({
    where: {
      assetClass: "REAL_ESTATE",
      ...memberFilter,
    },
    include: {
      account: {
        include: { familyMember: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  let totalValuation = 0;
  let totalCost = 0;
  let totalMonthlyRent = 0;
  let totalMortgage = 0;

  const parsedProperties = properties.map((p) => {
    let meta: any = {};
    try {
      meta = p.metadata ? JSON.parse(p.metadata) : {};
    } catch {}

    const curVal = p.quantity * p.currentPrice;
    const invCost = p.quantity * p.avgBuyPrice;
    const gain = curVal - invCost;
    const gainPct = invCost > 0 ? (gain / invCost) * 100 : 0;
    const rent = Number(meta.monthlyRental) || 0;
    const mortgage = Number(meta.mortgageOutstanding) || 0;
    const netEquity = curVal - mortgage;
    const rentalYield = curVal > 0 ? ((rent * 12) / curVal) * 100 : 0;

    totalValuation += curVal;
    totalCost += invCost;
    totalMonthlyRent += rent;
    totalMortgage += mortgage;

    return {
      ...p,
      currentValuation: curVal,
      investedCost: invCost,
      gain,
      gainPct,
      monthlyRent: rent,
      mortgage,
      netEquity,
      rentalYield,
      carpetArea: meta.carpetAreaSqFt,
      tenantName: meta.tenantName,
      leaseExpiry: meta.leaseExpiry,
    };
  });

  const totalAppreciation = totalValuation - totalCost;
  const totalAppreciationPct = totalCost > 0 ? (totalAppreciation / totalCost) * 100 : 0;
  const portfolioRentalYield = totalValuation > 0 ? ((totalMonthlyRent * 12) / totalValuation) * 100 : 0;
  const totalNetEquity = totalValuation - totalMortgage;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Real Estate & Physical Property Hub
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Valuation tracking, rental yield analytics, lease milestones, and mortgage liabilities
        </p>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
            <Building2 className="h-4 w-4 text-purple-400" />
            <span>Total Property Valuation</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {formatINR(totalValuation)}
          </div>
          <div className="text-xs text-purple-400/90 font-mono">
            {formatINR(totalValuation, { compact: true })} across {parsedProperties.length} assets
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span>Capital Appreciation</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            +{formatINR(totalAppreciation)}
          </div>
          <div className="text-xs text-emerald-400/80 font-mono">
            +{totalAppreciationPct.toFixed(1)}% unrealized gain
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
            <Key className="h-4 w-4 text-amber-400" />
            <span>Monthly Rental Cashflow</span>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {formatINR(totalMonthlyRent)}
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {portfolioRentalYield.toFixed(2)}% gross rental yield
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
            <Landmark className="h-4 w-4 text-cyan-400" />
            <span>Net Equity (Post Debt)</span>
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono">
            {formatINR(totalNetEquity)}
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Debt: {formatINR(totalMortgage, { compact: true })}
          </div>
        </div>
      </div>

      {/* Property Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Property Portfolio List</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {parsedProperties.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all space-y-4 shadow-xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {p.subCategory || "Real Estate"}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {p.symbol}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          p.account.familyMember.avatarColor || "#10b981",
                      }}
                    />
                    <span>{p.account.familyMember.name}</span>
                    <span>•</span>
                    <span className="font-mono">{p.account.name}</span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-lg font-black text-white">
                    {formatINR(p.currentValuation)}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-bold">
                    +{formatINR(p.gain, { compact: true })} ({p.gainPct.toFixed(1)}%)
                  </div>
                </div>
              </div>

              {/* Property Specs Grid */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">
                    Purchase Cost
                  </span>
                  <span className="text-slate-300 font-bold">
                    {formatINR(p.investedCost, { compact: true })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">
                    Monthly Rent
                  </span>
                  <span className="text-amber-400 font-bold">
                    {p.monthlyRent > 0 ? formatINR(p.monthlyRent) : "Self-Occupied"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">
                    Gross Yield
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {p.monthlyRent > 0 ? `${p.rentalYield.toFixed(2)}%` : "N/A"}
                  </span>
                </div>
              </div>

              {/* Tenant & Mortgage details */}
              <div className="space-y-2 text-xs text-slate-300">
                {p.tenantName && (
                  <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-slate-400">Tenant: {p.tenantName}</span>
                    {p.leaseExpiry && (
                      <span className="text-slate-500 font-mono">
                        Lease Expiry: {p.leaseExpiry}
                      </span>
                    )}
                  </div>
                )}

                {p.mortgage > 0 ? (
                  <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono">
                    <span>Outstanding Home Loan / Mortgage:</span>
                    <span className="font-bold">{formatINR(p.mortgage)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Freehold Property — 100% Debt Free</span>
                  </div>
                )}
              </div>

              {p.notes && (
                <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/60">
                  {p.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
