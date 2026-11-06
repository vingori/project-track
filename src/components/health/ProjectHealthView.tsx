"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Plus,
  Clock,
  Shield,
  Calendar,
  Users,
  Target,
  Repeat,
  ArrowLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function ProjectHealthView() {
  const { currentProjectKey, refreshKey, triggerRefresh } = useApp();

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [status, setStatus] = useState<string>("GREEN");
  const [scheduleHealth, setScheduleHealth] = useState<string>("GREEN");
  const [budgetHealth, setBudgetHealth] = useState<string>("GREEN");
  const [scopeHealth, setScopeHealth] = useState<string>("GREEN");
  const [clientSentiment, setClientSentiment] = useState<string>("GOOD");
  const [summary, setSummary] = useState<string>("");
  const [blockers, setBlockers] = useState<string>("");
  const [nextSteps, setNextSteps] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${currentProjectKey}/health`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentProjectKey, refreshKey]);

  const handleSubmitHealthCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${currentProjectKey}/health`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          scheduleHealth,
          budgetHealth,
          scopeHealth,
          clientSentiment,
          summary: summary.trim(),
          blockers: blockers.trim() || null,
          nextSteps: nextSteps.trim() || null,
        }),
      });

      if (res.ok) {
        setIsSubmitModalOpen(false);
        setSummary("");
        setBlockers("");
        setNextSteps("");
        triggerRefresh();
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs text-slate-400">
        Evaluating project health matrices and historical governance check-ins...
      </div>
    );
  }

  const { project, healthChecks, automatedDiagnostics } = data;

  const getRagBadge = (val: string) => {
    switch (val) {
      case "GREEN":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">GREEN</span>;
      case "AMBER":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">AMBER</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">RED</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/projects/${currentProjectKey}/board`}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                <span>Project Health Checks & Delivery Governance</span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Project [{project.key}] {project.name} {project.clientName ? `• Client: ${project.clientName}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Submit Health Check-in</span>
            </button>
          </div>
        </div>

        {/* AUTOMATED HEALTH ANALYSIS CARD */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Automated Health Diagnostics Engine
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Current Status:</span>
              {getRagBadge(project.ragStatus)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Schedule */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Schedule Health</span>
                {getRagBadge(automatedDiagnostics.scheduleHealth)}
              </div>
              <p className="text-[11px] text-slate-500">
                {automatedDiagnostics.metrics.overdueMilestones > 0
                  ? `${automatedDiagnostics.metrics.overdueMilestones} milestone(s) past target date`
                  : "All milestone deliverables on track"}
              </p>
            </div>

            {/* Budget / Retainer Burn */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Budget / Burn Health</span>
                {getRagBadge(automatedDiagnostics.budgetHealth)}
              </div>
              <p className="text-[11px] text-slate-500">
                {project.type === "RETAINER"
                  ? "Pacing vs monthly retainer cycle"
                  : "Logged hours vs estimated milestone budget"}
              </p>
            </div>

            {/* Defects / Scope */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Risk & Scope Health</span>
                {getRagBadge(automatedDiagnostics.scopeHealth)}
              </div>
              <p className="text-[11px] text-slate-500">
                {automatedDiagnostics.metrics.openBlockers > 0
                  ? `${automatedDiagnostics.metrics.openBlockers} open blocker/critical ticket(s)`
                  : "Zero critical blockers currently active"}
              </p>
            </div>
          </div>
        </div>

        {/* HISTORICAL HEALTH CHECK-INS TIMELINE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Health Check-in History ({healthChecks.length})
            </h3>
          </div>

          {healthChecks.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-xs text-slate-400">
              No health check-ins logged yet. Click &quot;Submit Health Check-in&quot; to record the first status.
            </div>
          ) : (
            <div className="space-y-4">
              {healthChecks.map((check: any) => (
                <div
                  key={check.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        {check.author?.name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {check.author?.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({check.author?.role})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(check.createdAt).toLocaleDateString()} at{" "}
                          {new Date(check.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Status:</span>
                      {getRagBadge(check.status)}
                    </div>
                  </div>

                  {/* Matrix Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Schedule</span>
                      <strong className="text-slate-800 dark:text-slate-200">{check.scheduleHealth}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Budget</span>
                      <strong className="text-slate-800 dark:text-slate-200">{check.budgetHealth}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Scope</span>
                      <strong className="text-slate-800 dark:text-slate-200">{check.scopeHealth}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Client Sentiment</span>
                      <strong className="text-slate-800 dark:text-slate-200">{check.clientSentiment}</strong>
                    </div>
                  </div>

                  {/* Summary Narrative */}
                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    {check.summary}
                  </div>

                  {/* Blockers & Next Steps */}
                  {(check.blockers || check.nextSteps) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      {check.blockers && (
                        <div className="text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900">
                          <strong className="block text-[11px] mb-0.5">Identified Blockers / Risks:</strong>
                          <span>{check.blockers}</span>
                        </div>
                      )}
                      {check.nextSteps && (
                        <div className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900">
                          <strong className="block text-[11px] mb-0.5">Mitigation Plan & Next Steps:</strong>
                          <span>{check.nextSteps}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL: SUBMIT HEALTH CHECK */}
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  <span>Submit Weekly Project Health Check</span>
                </h3>
                <button
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitHealthCheck} className="space-y-4 text-xs">
                {/* Overall Status */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Overall Project RAG Status *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["GREEN", "AMBER", "RED"].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setStatus(r)}
                        className={`py-2 rounded-lg font-bold border transition ${
                          status === r
                            ? r === "GREEN"
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : r === "AMBER"
                              ? "bg-amber-600 text-white border-amber-600"
                              : "bg-rose-600 text-white border-rose-600"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-Pillars */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Schedule Health
                    </label>
                    <select
                      value={scheduleHealth}
                      onChange={(e) => setScheduleHealth(e.target.value)}
                      className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="GREEN">Green (On Schedule)</option>
                      <option value="AMBER">Amber (Minor Slippage)</option>
                      <option value="RED">Red (Major Milestone Delay)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Budget / Retainer Burn
                    </label>
                    <select
                      value={budgetHealth}
                      onChange={(e) => setBudgetHealth(e.target.value)}
                      className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="GREEN">Green (Within Pool)</option>
                      <option value="AMBER">Amber (Burning Fast)</option>
                      <option value="RED">Red (Budget / Retainer Overrun)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Scope / Quality
                    </label>
                    <select
                      value={scopeHealth}
                      onChange={(e) => setScopeHealth(e.target.value)}
                      className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="GREEN">Green (Scope Controlled)</option>
                      <option value="AMBER">Amber (Unplanned Creep)</option>
                      <option value="RED">Red (Unmanageable Creep)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Client Sentiment
                    </label>
                    <select
                      value={clientSentiment}
                      onChange={(e) => setClientSentiment(e.target.value)}
                      className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="EXCELLENT">Excellent</option>
                      <option value="GOOD">Good / Satisfied</option>
                      <option value="AT_RISK">At Risk / Escalation Warning</option>
                      <option value="POOR">Poor / Severe Friction</option>
                    </select>
                  </div>
                </div>

                {/* Summary narrative */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Health Check Summary Narrative *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Executive summary of delivery progress, achievements, or risks this week..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Blockers */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Key Blockers or Constraints (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Waiting on client AWS IAM role credentials"
                    value={blockers}
                    onChange={(e) => setBlockers(e.target.value)}
                    className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Next Steps */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mitigation Plan & Next Steps (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Schedule emergency architecture sync on Monday"
                    value={nextSteps}
                    onChange={(e) => setNextSteps(e.target.value)}
                    className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="rounded px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 text-xs font-bold transition shadow-xs"
                  >
                    {submitting ? "Submitting..." : "Save Health Check"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
