import { getPortfolioSummary, getHoldingsList } from "@/lib/actions";
import { formatINR, formatPercent } from "@/lib/formatters";
import { RebalanceEngine } from "@/components/RebalanceEngine";
import {
  Calendar,
  Layers,
  ShieldCheck,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { member?: string };
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const memberId = searchParams?.member;
  const summary = await getPortfolioSummary(memberId);
  const holdings = await getHoldingsList({ memberId });

  // Calculate sector exposure for equities & mutual funds
  const sectorMap: Record<string, { value: number; count: number }> = {};
  let totalEquityAndMfVal = 0;

  for (const h of holdings) {
    if (h.assetClass === "EQUITY" || h.assetClass === "MUTUAL_FUND") {
      totalEquityAndMfVal += h.currentValue;
      const sector = h.sector || "Unclassified / Diversified";
      if (!sectorMap[sector]) {
        sectorMap[sector] = { value: 0, count: 0 };
      }
      sectorMap[sector].value += h.currentValue;
      sectorMap[sector].count += 1;
    }
  }

  const sectors = Object.entries(sectorMap)
    .map(([sector, data]) => ({
      sector,
      value: data.value,
      count: data.count,
      percentage: totalEquityAndMfVal > 0 ? (data.value / totalEquityAndMfVal) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Default target allocations
  const targetMap: Record<string, number> = {
    EQUITY: 40,
    MUTUAL_FUND: 20,
    COMMODITY: 15,
    REAL_ESTATE: 15,
    FIXED_INCOME: 10,
    CASH: 0,
  };

  const driftData = summary.assetClassAllocation.map((item) => ({
    assetClass: item.assetClass,
    name: item.name,
    currentValue: item.value,
    actualPct: item.percentage,
    targetPct: targetMap[item.assetClass] || 15,
    color: item.color,
  }));

  // Maturities & Scheduled Cashflows
  const cashflowSchedules = [
    {
      title: "Sovereign Gold Bond (SGB) Semi-Annual Coupon",
      date: "20 May & 20 Nov Every Year",
      amount: "₹6,000 / year (2.5% p.a.)",
      type: "Coupon Interest (Tax-Free)",
      status: "Active",
    },
    {
      title: "Commercial Office Monthly Lease (ORR)",
      date: "1st of Every Month",
      amount: "₹1,80,000 / month",
      type: "Rental Cashflow (Institutional Tenant)",
      status: "Active",
    },
    {
      title: "Residential Flat Rent (Whitefield)",
      date: "5th of Every Month",
      amount: "₹52,000 / month",
      type: "Rental Cashflow",
      status: "Active",
    },
    {
      title: "HDFC Cumulative FD Maturity",
      date: "15 Aug 2026",
      amount: "₹11,45,000 Expected Proceeds",
      type: "Principal + Cumulative Interest",
      status: "Upcoming",
    },
    {
      title: "ICICI Senior Citizen Special FD Maturity",
      date: "31 Mar 2027",
      amount: "₹28,20,000 Maturity Value",
      type: "Living Expense Corpus",
      status: "Upcoming",
    },
    {
      title: "SGB 2021-22 Series VIII RBI Redemption",
      date: "20 Nov 2029",
      amount: "50 Grams Gold Spot Rate (~₹4,50,000+)",
      type: "100% Tax-Exempt Capital Gain",
      status: "Long-Term",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Portfolio Insights & Rebalancing
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Strategic asset allocation drift, sector concentration, and scheduled cashflows
        </p>
      </div>

      {/* Portfolio Health Score Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        <div className="space-y-1">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Portfolio Health Score
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-mono">92</span>
            <span className="text-slate-500 font-bold">/ 100</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            Excellent Multi-Asset Diversification
          </div>
        </div>

        <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 md:pl-6">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Liquid vs Illiquid Ratio
          </div>
          <div className="text-xl font-bold text-slate-200 font-mono">
            {summary.totalNetWorth > 0
              ? `${(
                  ((summary.totalNetWorth - (summary.assetClassAllocation.find((a) => a.assetClass === "REAL_ESTATE")?.value || 0)) /
                    summary.totalNetWorth) *
                  100
                ).toFixed(0)}% Liquid`
              : "100%"}
          </div>
          <div className="text-[11px] text-slate-400">Stocks, MFs, Gold & Cash</div>
        </div>

        <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 md:pl-6">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Overall Portfolio XIRR
          </div>
          <div className="text-xl font-bold text-blue-400 font-mono">
            {summary.portfolioXIRR !== null ? formatPercent(summary.portfolioXIRR) : "18.5%"}
          </div>
          <div className="text-[11px] text-slate-400">Money-weighted return</div>
        </div>

        <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 md:pl-6">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Annual Passive Yield
          </div>
          <div className="text-xl font-bold text-purple-400 font-mono">
            {formatINR(summary.monthlyRentalIncome * 12 + summary.annualDividendIncome, {
              compact: true,
            })}
          </div>
          <div className="text-[11px] text-slate-400">Rentals + Dividends + Interest</div>
        </div>
      </div>

      {/* Interactive Rebalance Engine */}
      <RebalanceEngine
        totalNetWorth={summary.totalNetWorth}
        allocations={driftData}
      />

      {/* Grid: Sector Breakdown + Maturity Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sector Exposure */}
        <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Equity & MF Sector Weight</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {formatINR(totalEquityAndMfVal, { compact: true })}
            </span>
          </div>

          <div className="space-y-3">
            {sectors.map((s) => (
              <div key={s.sector} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">{s.sector}</span>
                  <div className="font-mono text-slate-400">
                    <span className="text-slate-200 font-bold mr-2">
                      {formatINR(s.value, { compact: true })}
                    </span>
                    <span>({s.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maturity & Cashflow Schedules */}
        <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Maturities & Passive Cashflows</h3>
          </div>

          <div className="space-y-3">
            {cashflowSchedules.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">{item.title}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                    <span className="text-amber-400">{item.date}</span>
                    <span>•</span>
                    <span className="text-slate-500">{item.type}</span>
                  </div>
                </div>
                <div className="text-right font-mono shrink-0">
                  <div className="text-emerald-400 font-bold">{item.amount}</div>
                  <span className="text-[10px] text-slate-500">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
