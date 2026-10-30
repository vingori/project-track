import { getPortfolioSummary } from "@/lib/actions";
import { formatINR, formatPercent } from "@/lib/formatters";
import { DashboardCharts } from "@/components/DashboardCharts";
import Link from "next/link";
import {
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  Wallet,
  Receipt,
  UploadCloud,
  FileSpreadsheet,
  Coins,
  Building2,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { member?: string };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const selectedMemberId = searchParams?.member;
  const summary = await getPortfolioSummary(selectedMemberId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner: Executive Net Worth & Performance */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Main Net Worth Metric */}
          <div className="lg:col-span-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Consolidated Family Wealth
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                Total Net Worth
              </p>
              <div className="flex items-baseline gap-3">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white font-mono">
                  {formatINR(summary.totalNetWorth)}
                </h1>
                <span className="text-sm font-semibold text-slate-400">
                  ({formatINR(summary.totalNetWorth, { compact: true })})
                </span>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
                <ArrowUpRight className="h-4 w-4" />
                <span>{formatPercent(summary.totalGainPct)}</span>
                <span className="text-xs font-normal text-emerald-300/80">Overall Return</span>
              </div>

              <div className="text-sm font-medium text-slate-300">
                P&L:{" "}
                <span className="text-emerald-400 font-bold font-mono">
                  +{formatINR(summary.totalUnrealizedGain)}
                </span>
              </div>

              {summary.portfolioXIRR !== null && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>XIRR: {formatPercent(summary.portfolioXIRR)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Key Stat Cards (Invested, Rental, Cashflows) */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <Wallet className="h-3.5 w-3.5 text-slate-400" />
                <span>Invested Capital</span>
              </div>
              <div className="text-base font-bold text-slate-200 font-mono">
                {formatINR(summary.totalInvested, { compact: true })}
              </div>
              <div className="text-[10px] text-slate-500">Across all accounts</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-purple-400 text-xs font-medium">
                <Building2 className="h-3.5 w-3.5" />
                <span>Monthly Rental</span>
              </div>
              <div className="text-base font-bold text-purple-300 font-mono">
                {formatINR(summary.monthlyRentalIncome)}
              </div>
              <div className="text-[10px] text-purple-400/70">
                {formatINR(summary.monthlyRentalIncome * 12, { compact: true })}/year yield
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                <Coins className="h-3.5 w-3.5" />
                <span>Cashflow & Payouts</span>
              </div>
              <div className="text-base font-bold text-amber-300 font-mono">
                {formatINR(summary.annualDividendIncome)}
              </div>
              <div className="text-[10px] text-amber-400/70">Dividends & SGB Coupons</div>
            </div>
          </div>
        </div>
      </div>

      {/* Family Member Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-200">Family Entity Breakdown</h2>
          <Link
            href="/accounts"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Manage Accounts →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summary.familyMembers.map((m) => {
            const share =
              summary.totalNetWorth > 0
                ? (m.totalValue / summary.totalNetWorth) * 100
                : 0;

            return (
              <div
                key={m.id}
                className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: m.avatarColor }}
                    />
                    <span className="font-semibold text-sm text-slate-200">
                      {m.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {m.relationship}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="text-lg font-bold text-white font-mono">
                    {formatINR(m.totalValue)}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center justify-between font-mono">
                    <span>{share.toFixed(1)}% of family wealth</span>
                    <span>{m.accountCount} accounts</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${share}%`,
                      backgroundColor: m.avatarColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle Grid: Asset Allocation Charts + Concentration Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Charts */}
        <div className="lg:col-span-8">
          <DashboardCharts
            assetClasses={summary.assetClassAllocation}
            brokers={summary.brokerAllocation}
          />
        </div>

        {/* Concentration & Advisory */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Risk & Concentration</h3>
            </div>

            <div className="space-y-3">
              {summary.concentrationAlerts.length > 0 ? (
                summary.concentrationAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-amber-300">
                      <span>{alert.name}</span>
                      <span>{alert.weightPct.toFixed(1)}% Weight</span>
                    </div>
                    <p className="leading-relaxed text-slate-300 text-[11px]">
                      {alert.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Portfolio is well-diversified with no single equity position above 10%.</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800">
              <Link
                href="/analytics"
                className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                Open Rebalancing Simulator →
              </Link>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Quick Management
            </h4>
            <div className="space-y-2">
              <Link
                href="/import-export"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <UploadCloud className="h-4 w-4 text-emerald-400" />
                  <span>Import Zerodha / Groww CSV</span>
                </div>
                <span className="text-slate-500">→</span>
              </Link>

              <Link
                href="/tax"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="h-4 w-4 text-blue-400" />
                  <span>Tax & LTCG/STCG Audit</span>
                </div>
                <span className="text-slate-500">→</span>
              </Link>

              <Link
                href="/real-estate"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4 text-purple-400" />
                  <span>Real Estate & Rental Yields</span>
                </div>
                <span className="text-slate-500">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Holdings Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Top Performing Assets</h3>
            <p className="text-xs text-slate-400">Highest unrealized returns across your family accounts</p>
          </div>
          <Link
            href="/holdings"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            View All Holdings ({summary.topGainers.length}+) →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Asset / Symbol</th>
                <th className="pb-3 font-semibold">Asset Class</th>
                <th className="pb-3 font-semibold text-right">Current Value</th>
                <th className="pb-3 font-semibold text-right">Unrealized Gain</th>
                <th className="pb-3 font-semibold text-right">Gain %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {summary.topGainers.map((item) => {
                const isPos = item.unrealizedGain >= 0;
                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-sans">
                      <div className="font-bold text-slate-200">{item.symbol}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {item.name}
                      </div>
                    </td>
                    <td className="py-3 font-sans">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                        {item.assetClass}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-200 font-bold">
                      {formatINR(item.currentValue)}
                    </td>
                    <td
                      className={`py-3 text-right font-semibold ${
                        isPos ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isPos ? "+" : ""}
                      {formatINR(item.unrealizedGain)}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold border ${
                          isPos
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {isPos ? "+" : ""}
                        {item.gainPct.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
