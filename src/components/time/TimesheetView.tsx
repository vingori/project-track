"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  Clock,
  Plus,
  Filter,
  Download,
  Calendar,
  Users,
  Briefcase,
  DollarSign,
  Tag,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function TimesheetView() {
  const { currentProjectKey, setSelectedIssueId, refreshKey, triggerRefresh } = useApp();

  const [data, setData] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedProject, setSelectedProject] = useState<string>("ALL");
  const [selectedUser, setSelectedUser] = useState<string>("ALL");
  const [selectedBillable, setSelectedBillable] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Log Time Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalProjectKey, setModalProjectKey] = useState<string>(currentProjectKey);
  const [modalIssueId, setModalIssueId] = useState<string>("");
  const [modalUserId, setModalUserId] = useState<string>("");
  const [modalHours, setModalHours] = useState<string>("2");
  const [modalDate, setModalDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [modalBillable, setModalBillable] = useState<boolean>(true);
  const [modalCategory, setModalCategory] = useState<string>("DEVELOPMENT");
  const [modalDescription, setModalDescription] = useState<string>("");
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch Worklogs
  const fetchWorklogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProject !== "ALL") params.append("projectKey", selectedProject);
      if (selectedUser !== "ALL") params.append("userId", selectedUser);
      if (selectedBillable !== "ALL") params.append("billable", selectedBillable);
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);

      const res = await fetch(`/api/worklogs?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorklogs();
  }, [selectedProject, selectedUser, selectedBillable, selectedCategory, refreshKey]);

  // Initial projects and users fetch
  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((res) => res.json()),
      fetch("/api/users").then((res) => res.json()),
    ])
      .then(([projs, us]) => {
        if (Array.isArray(projs)) setProjects(projs);
        if (Array.isArray(us)) {
          setUsers(us);
          if (us.length > 0) setModalUserId(us[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch issues for modal whenever modalProjectKey changes
  useEffect(() => {
    if (!modalProjectKey) return;
    fetch(`/api/issues?projectKey=${modalProjectKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setIssues(data);
          if (data.length > 0) setModalIssueId(data[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, [modalProjectKey]);

  const handleLogTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const hrs = parseFloat(modalHours);
    if (isNaN(hrs) || hrs <= 0) {
      setModalError("Please enter valid time spent in hours.");
      return;
    }
    if (!modalIssueId) {
      setModalError("Please select a task to log time against.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/worklogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: modalIssueId,
          userId: modalUserId,
          timeSpentHours: hrs,
          dateWorked: modalDate,
          billable: modalBillable,
          category: modalCategory,
          description: modalDescription.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to log time");
      }

      setIsLogModalOpen(false);
      setModalDescription("");
      triggerRefresh();
      fetchWorklogs();
    } catch (err: any) {
      setModalError(err.message || "Failed to log time.");
    } finally {
      setSubmitting(false);
    }
  };

  const worklogs = data?.worklogs || [];
  const summary = data?.summary || { totalHours: 0, billableHours: 0, billablePercent: 0, userBreakdown: [], projectBreakdown: [], categoryBreakdown: [] };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              <span>Timesheet & Time Logging System</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive billable time tracking across Greenfield milestones and Retainer hour pools.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Time on Task</span>
            </button>
          </div>
        </div>

        {/* TOP KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">Total Hours Logged</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {summary.totalHours}h
              </span>
              <span className="text-xs text-slate-500">logged</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Total recorded entries: <strong>{worklogs.length}</strong>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">Billable Hours</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {summary.billableHours}h
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                ({summary.billablePercent}% billable)
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Directly feeds invoices & retainers
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">Active Team Members</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {summary.userBreakdown.length}
              </span>
              <span className="text-xs text-slate-500">contributing</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Top logger: <strong>{summary.userBreakdown[0]?.name || "N/A"}</strong>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <span className="text-xs text-slate-500 block">Projects Logged</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {summary.projectBreakdown.length}
              </span>
              <span className="text-xs text-slate-500">projects</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Greenfield & Retainer initiatives
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Project Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-500">Project:</span>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.key}>
                    [{p.key}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* User Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-500">Team Member:</span>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Members</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Billable Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-500">Type:</span>
              <select
                value={selectedBillable}
                onChange={(e) => setSelectedBillable(e.target.value)}
                className="rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Hours</option>
                <option value="true">Billable Only</option>
                <option value="false">Non-Billable Only</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-500">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Categories</option>
                <option value="DEVELOPMENT">Development</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="ARCHITECTURE">Architecture</option>
                <option value="DEVOPS">DevOps</option>
                <option value="QA">QA</option>
                <option value="CODE_REVIEW">Code Review</option>
                <option value="SUPPORT">Support</option>
                <option value="MEETING">Meeting</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong>{worklogs.length}</strong> time entries
          </div>
        </div>

        {/* WORKLOGS TABLE */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Team Member</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Task Key & Summary</th>
                  <th className="px-4 py-3">Work Category</th>
                  <th className="px-4 py-3 text-right">Time Spent</th>
                  <th className="px-4 py-3">Billable</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-xs text-slate-400">
                      Loading timesheets...
                    </td>
                  </tr>
                ) : worklogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-xs text-slate-400">
                      No time entries match the selected filters.
                    </td>
                  </tr>
                ) : (
                  worklogs.map((w: any) => (
                    <tr
                      key={w.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap">
                        {new Date(w.dateWorked).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                            {w.user.name.split(" ").map((n: string) => n[0]).join("")}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {w.user.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded">
                            {w.issue?.project?.key}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                            {w.issue?.project?.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedIssueId(w.issue?.id)}
                          className="text-left group"
                        >
                          <span className="font-mono text-[11px] font-bold text-slate-500 group-hover:text-indigo-600 mr-1.5">
                            {w.issue?.key}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:underline line-clamp-1">
                            {w.issue?.title}
                          </span>
                        </button>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {w.category || "DEVELOPMENT"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                        {w.timeSpentHours} hrs
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {w.billable ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Billable
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Non-billable
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {w.description || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOG TIME MODAL */}
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <span>Log Time on Project Task</span>
                </h3>
                <button
                  onClick={() => setIsLogModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                >
                  ✕
                </button>
              </div>

              {modalError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-300 text-xs text-rose-700 dark:text-rose-300">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleLogTimeSubmit} className="space-y-4 text-xs">
                {/* Project Selector */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Project *
                  </label>
                  <select
                    value={modalProjectKey}
                    onChange={(e) => setModalProjectKey(e.target.value)}
                    className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.key}>
                        [{p.key}] {p.name} ({p.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Task / Issue Selector */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Task / Deliverable *
                  </label>
                  <select
                    value={modalIssueId}
                    onChange={(e) => setModalIssueId(e.target.value)}
                    className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    {issues.map((i) => (
                      <option key={i.id} value={i.id}>
                        [{i.key}] {i.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team Member */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Team Member *
                    </label>
                    <select
                      value={modalUserId}
                      onChange={(e) => setModalUserId(e.target.value)}
                      className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Work Date *
                    </label>
                    <input
                      type="date"
                      value={modalDate}
                      onChange={(e) => setModalDate(e.target.value)}
                      className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Time & Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Time Spent (Hours) *
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      value={modalHours}
                      onChange={(e) => setModalHours(e.target.value)}
                      className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Work Category
                    </label>
                    <select
                      value={modalCategory}
                      onChange={(e) => setModalCategory(e.target.value)}
                      className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="DEVELOPMENT">Development</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="ARCHITECTURE">Architecture</option>
                      <option value="DEVOPS">DevOps & Cloud</option>
                      <option value="SECURITY">Security</option>
                      <option value="QA">QA & Testing</option>
                      <option value="CODE_REVIEW">Code Review</option>
                      <option value="SUPPORT">Support / Incident</option>
                      <option value="MEETING">Meeting / Planning</option>
                    </select>
                  </div>
                </div>

                {/* Billable Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="modal-billable"
                    checked={modalBillable}
                    onChange={(e) => setModalBillable(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="modal-billable" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Billable Work (Counts towards retainer burn or client milestone billing)
                  </label>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Work Description / Contribution Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Details on what was completed..."
                    value={modalDescription}
                    onChange={(e) => setModalDescription(e.target.value)}
                    className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsLogModalOpen(false)}
                    className="rounded px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 text-xs font-bold transition shadow-xs"
                  >
                    {submitting ? "Saving Log..." : "Confirm & Log Time"}
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
