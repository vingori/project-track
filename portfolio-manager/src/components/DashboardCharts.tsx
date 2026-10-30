"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR } from "@/lib/formatters";

interface AssetClassItem {
  name: string;
  assetClass: string;
  value: number;
  percentage: number;
  color: string;
  gain: number;
  gainPct: number;
}

interface BrokerItem {
  broker: string;
  value: number;
  percentage: number;
}

interface DashboardChartsProps {
  assetClasses: AssetClassItem[];
  brokers: BrokerItem[];
}

export function DashboardCharts({ assetClasses, brokers }: DashboardChartsProps) {
  const [activeTab, setActiveTab] = useState<"asset" | "broker">("asset");

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-semibold text-slate-200">{data.name || data.broker}</p>
          <p className="text-emerald-400 font-bold">{formatINR(data.value)}</p>
          <p className="text-slate-400 font-mono">
            {data.percentage.toFixed(1)}% of total portfolio
          </p>
          {data.gain !== undefined && (
            <p
              className={
                data.gain >= 0 ? "text-emerald-400" : "text-rose-400"
              }
            >
              P&L: {data.gain >= 0 ? "+" : ""}{formatINR(data.gain)} ({data.gainPct.toFixed(1)}%)
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Portfolio Allocation</h3>
          <p className="text-xs text-slate-400">Distribution across asset classes & brokers</p>
        </div>
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setActiveTab("asset")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === "asset"
                ? "bg-slate-800 text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Asset Class
          </button>
          <button
            onClick={() => setActiveTab("broker")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === "broker"
                ? "bg-slate-800 text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Brokers / Accounts
          </button>
        </div>
      </div>

      {activeTab === "asset" ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Donut Chart */}
          <div className="md:col-span-5 h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetClasses}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {assetClasses.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#0f172a"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Allocation
              </span>
              <span className="text-lg font-bold text-white">
                {assetClasses.length} Assets
              </span>
            </div>
          </div>

          {/* Detailed Legend */}
          <div className="md:col-span-7 space-y-2.5">
            {assetClasses.map((item) => (
              <div
                key={item.assetClass}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition-all text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <span className="font-semibold text-slate-200">{item.name}</span>
                    <span className="ml-2 font-mono text-[11px] text-slate-500">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-slate-200 font-bold">{formatINR(item.value)}</div>
                  <div
                    className={`text-[10px] ${
                      item.gain >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {item.gain >= 0 ? "+" : ""}
                    {formatINR(item.gain, { compact: true })} ({item.gainPct.toFixed(1)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={brokers} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
              <XAxis
                type="number"
                tickFormatter={(v) => formatINR(v, { compact: true })}
                stroke="#64748b"
                fontSize={11}
              />
              <YAxis
                type="category"
                dataKey="broker"
                stroke="#94a3b8"
                fontSize={12}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
