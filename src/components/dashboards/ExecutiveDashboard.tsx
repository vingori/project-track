"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Target,
  Repeat,
  Layers,
  Calendar,
  DollarSign,
  AlertCircle,
  Plus,
  Briefcase,
  ChevronRight,
  FileCheck,
} from "lucide-react";
import {
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
  const { setCurrentProjectKey, refreshKey } = useApp();

  const [analytics, setAnalytics] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "GREENFIELD" | "RETAINER" | "HEALTH">("ALL");

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
        Aggregating Greenfield milestones, Retainer burn-down, and governance health metrics...
      </div>
    );
  }

  const greenCount = projects.filter((p) => p.ragStatus === "GREEN").length;
  const amberCount = projects.filter((p) => p.ragStatus === "AMBER").length;
  const redCount = projects.filter((p) => p.ragStatus === "RED").length;

  const greenfieldProjects = projects.filter(
    (p) => p.type === "GREENFIELD_MILESTONE" || p.type === "HYBRID_MILESTONE"
  );
  const retainerProjects = projects.filter((p) => p.type === "RETAINER");

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Project Delivery & Retainer Governance Dashboard</span>
            </h1>
            <p className="text-xs text-slate-500">
              Cross-portfolio intelligence tracking Greenfield milestones, Retainer burn rates, team allocations, and RAG health checks.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/timesheet"
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-2xs"
            >
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              <span>Timesheet & Time Logs</span>
            </Link>

            <Link
              href="/onboarding"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Project Onboarding</span>
            </Link>
          </div>
        </div>

        {/* TOP KPI STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Portfolio RAG */}
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
              <span className="flex items-center gap-1 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                {redCount} Red
              </span>
            </div>
          </div>

          {/* Retainer Hours & Burn */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Retainer Pools Burn</span>
              <Repeat className="h-4 w-4 text-purple-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {retainerProjects.reduce((acc, p) => acc + (p.stats?.retainerUsedHours || 0), 0)}h
              </span>
              <span className="text-xs text-slate-500">
                of {retainerProjects.reduce((acc, p) => acc + (p.stats?.retainerAvailableHours || 0), 0)}h allocated
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>Active Retainers: <strong>{retainerProjects.length}</strong></span>
              {retainerProjects.some((p) => p.stats?.isOverage) ? (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Overage Active
                </span>
              ) : (
                <span className="text-emerald-600 font-semibold">Capacity Balanced</span>
              )}
            </div>
          </div>

          {/* Greenfield Milestones Reached */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Greenfield Milestones</span>
              <Target className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {analytics.greenfieldSummary?.reduce((acc: number, p: any) => acc + p.reachedMilestones, 0) || 0}
              </span>
              <span className="text-xs text-slate-500">
                / {analytics.greenfieldSummary?.reduce((acc: number, p: any) => acc + p.totalMilestones, 0) || 0} Delivered
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>Greenfield Projects: <strong>{greenfieldProjects.length}</strong></span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                On Schedule
              </span>
            </div>
          </div>

          {/* Billable Time Logged & Collaboration */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Time Logged & Collaboration</span>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {analytics.timeTracking?.totalLoggedHours || 0}h
              </span>
              <span className="text-xs text-slate-500">
                ({analytics.timeTracking?.billablePercent || 0}% billable)
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>Collaborative Tasks: <strong>{analytics.collaborativeIssuesCount || 0}</strong></span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Active Co-working</span>
            </div>
          </div>
        </div>

        {/* View Selection Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`pb-2.5 transition border-b-2 ${
              activeTab === "ALL"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            All Projects Rollup ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab("GREENFIELD")}
            className={`pb-2.5 flex items-center gap-1.5 transition border-b-2 ${
              activeTab === "GREENFIELD"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            Greenfield Milestone Projects ({greenfieldProjects.length})
          </button>
          <button
            onClick={() => setActiveTab("RETAINER")}
            className={`pb-2.5 flex items-center gap-1.5 transition border-b-2 ${
              activeTab === "RETAINER"
                ? "border-purple-600 text-purple-600 dark:text-purple-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Repeat className="h-3.5 w-3.5" />
            Retainer Style Projects ({retainerProjects.length})
          </button>
          <button
            onClick={() => setActiveTab("HEALTH")}
            className={`pb-2.5 flex items-center gap-1.5 transition border-b-2 ${
              activeTab === "HEALTH"
                ? "border-rose-600 text-rose-600 dark:text-rose-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            RAG Health Checks & Risk Logs
          </button>
        </div>

        {/* TAB 1: RETAINER SECTION */}
        {(activeTab === "ALL" || activeTab === "RETAINER") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span>Retainer Projects Capacity & Burn-Down Monitoring</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time hour consumption against contracted monthly pools, rollover allowances, and overage billing.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.retainerSummary?.map((ret: any) => {
                const burn = ret.burnPercent;
                const isHigh = ret.isHighBurnRisk;

                return (
                  <div
                    key={ret.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4 hover:border-purple-400 dark:hover:border-purple-600 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded">
                            {ret.key}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            Client: <strong>{ret.clientName || "Direct Account"}</strong>
                          </span>
                        </div>
                        <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                          {ret.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ret.ragStatus === "GREEN"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : ret.ragStatus === "AMBER"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {ret.ragStatus}
                        </span>
                      </div>
                    </div>

                    {/* Retainer Burn-down Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600 dark:text-slate-400">
                          Retainer Pool Consumption:
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {ret.usedHours} / {ret.totalAvailable} hrs ({burn}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            ret.isOverage
                              ? "bg-rose-500"
                              : burn >= 80
                              ? "bg-amber-500"
                              : "bg-purple-600"
                          }`}
                          style={{ width: `${Math.min(100, burn)}%` }}
                        />
                      </div>
                    </div>

                    {/* Breakdown metrics */}
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Monthly Base</span>
                        <strong className="text-slate-800 dark:text-slate-200">{ret.monthlyHours}h</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Rollover Available</span>
                        <strong className="text-slate-800 dark:text-slate-200">+{ret.rolloverHours}h</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Days Left in Cycle</span>
                        <strong className="text-slate-800 dark:text-slate-200">{ret.daysRemainingInMonth} days</strong>
                      </div>
                    </div>

                    {/* Warning / Overage Notice */}
                    {ret.isOverage && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>
                          Retainer exceeded by <strong>{ret.overageHours} hrs</strong>. Billed at standard overage rate (${ret.overageRate}/hr).
                        </span>
                      </div>
                    )}

                    {!ret.isOverage && isHigh && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>
                          Burn rate alert: {ret.usedHours}h consumed with {ret.daysRemainingInMonth} days left in current cycle.
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-500">
                        Standard rate: ${ret.hourlyRate}/hr
                      </span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/projects/${ret.key}/board`}
                          onClick={() => setCurrentProjectKey(ret.key)}
                          className="flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          <span>Open Retainer Board</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: GREENFIELD SECTION */}
        {(activeTab === "ALL" || activeTab === "GREENFIELD") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Greenfield Milestone Delivery Roadmap & Phase Progress</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Phase gateways, deliverable targets, and actual hours burned against milestone estimates.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {analytics.greenfieldSummary?.map((gf: any) => (
                <div
                  key={gf.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4 hover:border-emerald-400 dark:hover:border-emerald-600 transition"
                >
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                          {gf.key}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          Client: <strong>{gf.clientName || "Internal Enterprise"}</strong>
                        </span>
                      </div>
                      <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                        {gf.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs">
                        <span className="text-slate-500 block text-[10px]">Hours Burned</span>
                        <strong className="text-slate-900 dark:text-white">
                          {gf.loggedHours} / {gf.budgetHours || "N/A"}h
                        </strong>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          gf.ragStatus === "GREEN"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : gf.ragStatus === "AMBER"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {gf.ragStatus} Status
                      </span>
                    </div>
                  </div>

                  {/* Milestones Horizontal Phase Gateways */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Milestone Phase Deliverables:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {gf.milestones?.map((m: any, idx: number) => {
                        const isReached = m.status === "REACHED";
                        const isOverdue = !isReached && new Date(m.targetDate) < new Date();

                        return (
                          <div
                            key={m.id || idx}
                            className={`p-3 rounded-lg border text-xs space-y-2 transition ${
                              isReached
                                ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                                : isOverdue
                                ? "bg-rose-50/50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800"
                                : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Phase {idx + 1}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  isReached
                                    ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                                    : isOverdue
                                    ? "bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                }`}
                              >
                                {m.status}
                              </span>
                            </div>

                            <p className="font-semibold text-slate-900 dark:text-white line-clamp-2">
                              {m.title}
                            </p>

                            <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                              <div className="flex items-center justify-between text-[10px] text-slate-500">
                                <span>Progress</span>
                                <span><strong>{m.progressPercent || 0}%</strong></span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isReached ? "bg-emerald-500" : "bg-indigo-500"
                                  }`}
                                  style={{ width: `${m.progressPercent || 0}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(m.targetDate).toLocaleDateString()}
                              </span>
                              {m.estimatedHours && (
                                <span>{m.loggedHours || 0}/{m.estimatedHours}h</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500">
                      Deliverables reached: <strong>{gf.reachedMilestones}</strong> of {gf.totalMilestones}
                    </span>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/projects/${gf.key}/health`}
                        className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-1"
                      >
                        <Activity className="h-3 w-3" />
                        <span>Health Checks</span>
                      </Link>
                      <Link
                        href={`/projects/${gf.key}/board`}
                        onClick={() => setCurrentProjectKey(gf.key)}
                        className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <span>Open Swimlane Board</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: HEALTH CHECKS & RISK LOGS */}
        {(activeTab === "ALL" || activeTab === "HEALTH") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-rose-500" />
                  <span>Project Health Check-ins & Risk Mitigation Ledger</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Weekly governance signoffs across Schedule, Budget, Scope, and Client Sentiment.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => {
                const check = proj.latestHealthCheck;

                return (
                  <div
                    key={proj.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                          {proj.key}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {proj.name}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          proj.ragStatus === "GREEN"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : proj.ragStatus === "AMBER"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {proj.ragStatus}
                      </span>
                    </div>

                    {check ? (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-4 text-[11px] text-slate-500">
                          <span>Schedule: <strong className="text-slate-800 dark:text-slate-200">{check.scheduleHealth}</strong></span>
                          <span>Budget: <strong className="text-slate-800 dark:text-slate-200">{check.budgetHealth}</strong></span>
                          <span>Sentiment: <strong className="text-slate-800 dark:text-slate-200">{check.clientSentiment}</strong></span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                          &quot;{check.summary}&quot;
                        </p>
                        {check.blockers && (
                          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                            <strong>Blocker:</strong> {check.blockers}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No health checks submitted yet.</p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-[11px] text-slate-400">
                        Lead: {proj.lead?.name || "Unassigned"}
                      </span>
                      <Link
                        href={`/projects/${proj.key}/health`}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <span>Submit / View Health</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TEAM WORKLOAD & TIME DISTRIBUTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contributor Hours */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              <span>Team Workload & Hours Logged</span>
            </h3>

            <div className="space-y-3">
              {analytics.contributorWorkload?.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {user.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">{user.name}</h4>
                      <p className="text-[10px] text-slate-500">{user.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Logged</span>
                      <strong className="text-slate-800 dark:text-slate-200">{user.hoursLogged}h</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Tasks</span>
                      <strong className="text-slate-800 dark:text-slate-200">{user.tickets}</strong>
                    </div>
                    {user.collaborativeTickets > 0 && (
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
                        {user.collaborativeTickets} Co-op
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time by Category Breakdown */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-purple-500" />
              <span>Time Distribution by Work Category</span>
            </h3>

            <div className="space-y-2.5">
              {analytics.timeTracking?.timeByCategory?.map((cat: any) => {
                const total = analytics.timeTracking.totalLoggedHours || 1;
                const percent = Math.round((cat.hours / total) * 100);

                return (
                  <div key={cat.name} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {cat.name}
                      </span>
                      <span className="text-slate-500">
                        <strong>{cat.hours}h</strong> ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
