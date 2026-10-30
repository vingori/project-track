"use client";

import { useState } from "react";
import { formatINR, formatDate } from "@/lib/formatters";
import {
  Bell,
  Sparkles,
  DollarSign,
  Gift,
  Split,
  Calendar,
  AlertTriangle,
  Building2,
  Coins,
  CheckCircle2,
  Filter,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  date: Date | string;
  title: string;
  symbol: string;
  holdingName: string;
  amount: number;
  quantity: number;
  price: number;
  notes?: string | null;
  accountName: string;
  broker: string;
  memberName: string;
  memberColor?: string | null;
}

interface MilestoneItem {
  id: string;
  title: string;
  symbol: string;
  entityName: string;
  date: string;
  type: "SGB_COUPON" | "FD_MATURITY" | "LEASE_EXPIRY";
  detail: string;
  amount?: string;
}

interface AlertItem {
  symbol: string;
  name: string;
  weightPct: number;
  type: "CRITICAL" | "WARNING" | "INFO";
  message: string;
}

interface NotificationsHubProps {
  activity: ActivityItem[];
  upcomingMilestones: MilestoneItem[];
  alerts: AlertItem[];
}

export function NotificationsHub({
  activity,
  upcomingMilestones,
  alerts,
}: NotificationsHubProps) {
  const [filterTab, setFilterTab] = useState<
    "ALL" | "DIVIDENDS" | "CORP_ACTIONS" | "MILESTONES" | "ALERTS"
  >("ALL");

  // Filtered activity items
  const filteredActivity = activity.filter((item) => {
    if (filterTab === "DIVIDENDS") return item.type === "DIVIDEND" || item.type === "RENT" || item.type === "INTEREST";
    if (filterTab === "CORP_ACTIONS") return item.type === "SPLIT" || item.type === "BONUS";
    return true;
  });

  const totalDividendsReceived = activity
    .filter((a) => a.type === "DIVIDEND" || a.type === "RENT" || a.type === "INTEREST")
    .reduce((sum, a) => sum + Math.abs(a.amount), 0);

  const corpActionsCount = activity.filter(
    (a) => a.type === "SPLIT" || a.type === "BONUS"
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span>Total Cash Income Logged</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatINR(totalDividendsReceived)}
          </div>
          <div className="text-[11px] text-slate-400">
            Dividends + Rental Yields + SGB Coupons
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Corporate Actions Applied</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {corpActionsCount}
          </div>
          <div className="text-[11px] text-slate-400">
            Stock Splits & Bonus Issues in Ledger
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Calendar className="h-4 w-4 text-blue-400" />
            <span>Upcoming Milestones</span>
          </div>
          <div className="text-2xl font-black text-blue-300 font-mono">
            {upcomingMilestones.length}
          </div>
          <div className="text-[11px] text-slate-400">
            FD Maturities, SGB Redemptions & Leases
          </div>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: "ALL", label: `All Activity (${activity.length})` },
            { id: "DIVIDENDS", label: `Dividends & Cash Payouts` },
            { id: "CORP_ACTIONS", label: `Splits & Bonuses (${corpActionsCount})` },
            { id: "MILESTONES", label: `Upcoming Maturities (${upcomingMilestones.length})` },
            { id: "ALERTS", label: `Portfolio Alerts (${alerts.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                filterTab === tab.id
                  ? "bg-emerald-500 text-slate-950 shadow-md font-bold"
                  : "bg-slate-900/70 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION: Upcoming Milestones (If selected or in ALL) */}
      {(filterTab === "ALL" || filterTab === "MILESTONES") &&
        upcomingMilestones.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span>Upcoming Financial Milestones & Maturities</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upcomingMilestones.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{m.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {m.symbol}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{m.detail}</p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Owner: {m.entityName}
                    </div>
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <div className="text-amber-400 font-bold">{m.date}</div>
                    {m.amount && (
                      <div className="text-emerald-400 text-[10px]">{m.amount}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* SECTION: Portfolio Alerts (If selected or in ALL) */}
      {(filterTab === "ALL" || filterTab === "ALERTS") && alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span>Risk & Concentration Alerts</span>
          </h3>

          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-200"
              >
                <div>
                  <strong className="text-amber-300 font-bold mr-2">{a.name}</strong>
                  <span>{a.message}</span>
                </div>
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-[11px]">
                  {a.weightPct.toFixed(1)}% Weight
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: Activity Stream (Dividends, Splits, Bonuses) */}
      {filterTab !== "MILESTONES" && filterTab !== "ALERTS" && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Historical Corporate Actions & Cashflow Stream</span>
          </h3>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold">
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-3">Asset / Symbol</th>
                    <th className="py-3 px-3">Family Entity & Broker</th>
                    <th className="py-3 px-3 text-right">Cash / Value</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredActivity.map((item) => {
                    const isDividend = item.type === "DIVIDEND";
                    const isSplit = item.type === "SPLIT";
                    const isBonus = item.type === "BONUS";
                    const isRent = item.type === "RENT";
                    const isInterest = item.type === "INTEREST";

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-sans">
                          {isDividend && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                              <DollarSign className="h-3 w-3" />
                              Dividend
                            </span>
                          )}
                          {isSplit && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[10px]">
                              <Split className="h-3 w-3" />
                              Stock Split
                            </span>
                          )}
                          {isBonus && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold text-[10px]">
                              <Gift className="h-3 w-3" />
                              Bonus Issue
                            </span>
                          )}
                          {isRent && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-[10px]">
                              <Building2 className="h-3 w-3" />
                              Rental Cashflow
                            </span>
                          )}
                          {isInterest && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold text-[10px]">
                              <Coins className="h-3 w-3" />
                              Coupon / Interest
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 font-sans">
                          <div className="font-bold text-slate-200">{item.symbol}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs font-mono">
                            {item.holdingName}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-sans">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: item.memberColor || "#10b981",
                              }}
                            />
                            <span className="font-semibold text-slate-200">
                              {item.memberName}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {item.broker} — {item.accountName}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          {item.amount > 0 ? (
                            <span className="text-emerald-400 font-bold text-sm">
                              +{formatINR(item.amount)}
                            </span>
                          ) : (
                            <span className="text-slate-500">Capital Adj.</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-slate-400 font-sans">
                          {formatDate(item.date)}
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 font-sans text-[11px] italic">
                          {item.notes || "Recorded corporate transaction"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
