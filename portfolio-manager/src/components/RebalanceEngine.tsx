"use client";

import { useState } from "react";
import { formatINR, formatPercent } from "@/lib/formatters";
import { Scale, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";

interface AllocationDriftItem {
  assetClass: string;
  name: string;
  currentValue: number;
  actualPct: number;
  targetPct: number;
  color: string;
}

interface RebalanceEngineProps {
  totalNetWorth: number;
  allocations: AllocationDriftItem[];
}

export function RebalanceEngine({
  totalNetWorth,
  allocations: initialAllocations,
}: RebalanceEngineProps) {
  const [allocations, setAllocations] = useState(initialAllocations);
  const [customNetWorth, setCustomNetWorth] = useState(totalNetWorth);
  const [freshCapital, setFreshCapital] = useState("0");

  const effectiveNetWorth = customNetWorth + (Number(freshCapital) || 0);

  const rebalanceActions = allocations.map((item) => {
    const targetValue = (item.targetPct / 100) * effectiveNetWorth;
    const diff = targetValue - item.currentValue;
    const driftPct = item.actualPct - item.targetPct;

    return {
      ...item,
      targetValue,
      diff,
      driftPct,
      action: diff > 1000 ? "BUY" : diff < -1000 ? "TRIM" : "BALANCED",
    };
  });

  const handleTargetChange = (assetClass: string, newTarget: number) => {
    setAllocations((prev) =>
      prev.map((a) => (a.assetClass === assetClass ? { ...a, targetPct: newTarget } : a))
    );
  };

  const totalTargetPct = allocations.reduce((sum, a) => sum + a.targetPct, 0);

  return (
    <div className="space-y-6">
      {/* Target Allocation & Drift Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">
                Asset Allocation & Rebalancing Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Identify asset class drift against family strategic targets
            </p>
          </div>

          {/* Fresh Capital Injection Simulator */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs">
            <span className="text-slate-400 font-medium">Inject Fresh Capital:</span>
            <input
              type="number"
              step="10000"
              value={freshCapital}
              onChange={(e) => setFreshCapital(e.target.value)}
              placeholder="₹0"
              className="w-32 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {totalTargetPct !== 100 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Target allocations currently sum to {totalTargetPct.toFixed(1)}% (should ideally be 100%).</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Asset Class</th>
                <th className="pb-3 text-right">Current Value</th>
                <th className="pb-3 text-right">Actual %</th>
                <th className="pb-3 text-center">Target %</th>
                <th className="pb-3 text-right">Target Value</th>
                <th className="pb-3 text-right">Drift</th>
                <th className="pb-3 text-center">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {rebalanceActions.map((row) => {
                const isOver = row.driftPct > 2;
                const isUnder = row.driftPct < -2;

                return (
                  <tr key={row.assetClass} className="hover:bg-slate-800/20">
                    <td className="py-3.5 font-sans">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="font-semibold text-slate-200">{row.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 text-right font-bold text-slate-200">
                      {formatINR(row.currentValue)}
                    </td>

                    <td className="py-3.5 text-right text-slate-300 font-bold">
                      {row.actualPct.toFixed(1)}%
                    </td>

                    {/* Adjustable target input */}
                    <td className="py-3.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={row.targetPct}
                        onChange={(e) =>
                          handleTargetChange(row.assetClass, Number(e.target.value))
                        }
                        className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="text-slate-500 ml-1">%</span>
                    </td>

                    <td className="py-3.5 text-right text-slate-300">
                      {formatINR(row.targetValue, { compact: true })}
                    </td>

                    <td className="py-3.5 text-right">
                      <span
                        className={`font-semibold ${
                          isOver
                            ? "text-rose-400"
                            : isUnder
                            ? "text-blue-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {row.driftPct > 0 ? "+" : ""}
                        {row.driftPct.toFixed(1)}%
                      </span>
                    </td>

                    {/* Action badge */}
                    <td className="py-3.5 text-center font-sans">
                      {row.action === "BUY" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                          + Invest {formatINR(Math.abs(row.diff), { compact: true })}
                        </span>
                      ) : row.action === "TRIM" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[11px]">
                          - Trim {formatINR(Math.abs(row.diff), { compact: true })}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[10px]">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          Balanced
                        </span>
                      )}
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
