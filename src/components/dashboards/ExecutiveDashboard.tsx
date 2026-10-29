"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  TrendingUp,
  Flame,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Users,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function ExecutiveDashboard() {
  const { currentProjectKey, refreshKey } = useApp();

  const [analytics, setAnalytics] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/analytics").then((res) => res.json()),
      fetch("/api/projects").then((res) => res.json()),
    ])
      .then(([analyticsData, projectsData]) => {
        setAnalytics(analyticsData);
        if (Array.isArray(projectsData)) setProjects(projectsData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading || !analytics) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs text-slate-400">
        Aggregating portfolio delivery and governance metrics...
      </div>
    );
  }

  const greenCount = projects.filter((p) => p.ragStatus === "GREEN").length;
  const amberCount = projects.filter((p) => p.ragStatus === "AMBER").length;
  const redCount = projects.filter((p) => p.ragStatus === "RED").length;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Executive Governance & Delivery Intelligence
            </h1>
            <p className="text-xs text-slate-500">
              Cross-project health rollups, sprint velocity burndowns, individual allocations, and SLA compliance.
            </p>
          </div>
        </div>

        {/* TOP KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Portfolio RAG Status */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Portfolio RAG Health</span>
              <Activity className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {projects.length}
              </span>
              <span className="text-xs text-slate-500">Active Projects</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold">
              <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {greenCount} Green
              </span>
              <span className="flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {amberCount} Amber
              </span>
              {redCount > 0 && (
                <span className="flex items-center gap-1 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  {redCount} Red
                </span>
              )}
            </div>
          </div>

          {/* Active Sprint Velocity */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Sprint Delivery Scope</span>
              <Flame className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                40
              </span>
              <span className="text-xs text-slate-500">Committed Points</span>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Active: <strong className="text-slate-800 dark:text-slate-200">{analytics.activeSprint?.name || "Sprint 22"}</strong>
            </div>
          </div>

          {/* SLA Compliance Rate */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>SLA Target Compliance</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {analytics.sla.complianceRate}%
              </span>
              <span className="text-xs text-slate-500">SLA Adherence</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span>{analytics.sla.compliant} Met</span>
              <span>•</span>
              <span className="text-rose-600 font-semibold">{analytics.sla.breached} Breached</span>
            </div>
          </div>

          {/* Mean Resolution Time */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Avg Time to Resolution</span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {analytics.sla.avgResolutionHours}h
              </span>
              <span className="text-xs text-slate-500">Avg MTTR</span>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              First Response: <strong>~{analytics.sla.avgFirstResponseMins} mins</strong>
            </div>
          </div>
        </div>

        {/* CHARTS ROW 1: Burndown & Velocity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Burndown Chart */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Sprint Burndown
                </h3>
                <p className="text-xs text-slate-500">
                  Ideal guideline vs Actual remaining story points
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.burndown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line
                    type="monotone"
                    dataKey="ideal"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    name="Ideal Burn"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#4f46e5"
                    name="Actual Remaining"
                    strokeWidth={2.5}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Velocity Trend */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sprint Velocity Trend
                </h3>
                <p className="text-xs text-slate-500">
                  Committed vs Delivered points over historical sprints
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.velocity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="sprint" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="committed" fill="#93c5fd" name="Committed Pts" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#4f46e5" name="Completed Pts" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* CHARTS ROW 2: Contributor Workload & Issue Type Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contributor Workload Distribution (2 Cols) */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Individual Team Member Allocation
                </h3>
                <p className="text-xs text-slate-500">
                  Current story point load and active work items per engineer
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {analytics.contributorWorkload.map((member: any) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                      {member.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {member.name}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {member.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {member.points}
                      </span>
                      <span className="text-slate-400 text-[10px] ml-1">pts</span>
                    </div>
                    <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (member.points / 25) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 w-16 text-right">
                      {member.tickets} tickets
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issue Type Distribution (1 Col) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Work Item Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Distribution by issue classification
              </p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.typeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {analytics.typeDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
