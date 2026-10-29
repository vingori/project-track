"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { formatTimeRemaining } from "@/lib/utils";
import {
  Search,
  Filter,
  User,
  Clock,
  Sparkles,
  AlertCircle,
  Plus,
  ArrowUpRight,
  Flame,
  Bug,
  BookOpen,
  CheckSquare,
  AlertTriangle,
  Download,
  Upload,
  Zap,
} from "lucide-react";

export default function KanbanBoard() {
  const { currentProjectKey, setSelectedIssueId, refreshKey, currentUserRole } = useApp();

  const [project, setProject] = useState<any | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("ALL");
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [governanceWarning, setGovernanceWarning] = useState<string | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMsg(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/projects/${currentProjectKey}/import`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setImportMsg(data.message || `Imported ${data.count} items!`);
        fetchData();
        setTimeout(() => setImportMsg(null), 4000);
      } else {
        setImportMsg(data.error || "Import failed.");
      }
    } catch {
      setImportMsg("Import connection error.");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  // Fetch project details and workflow statuses
  const fetchData = async () => {
    setLoading(true);
    try {
      const projRes = await fetch(`/api/projects/${currentProjectKey}`);
      const projData = await projRes.json();
      setProject(projData);

      const issuesRes = await fetch(`/api/issues?projectKey=${currentProjectKey}`);
      const issuesData = await issuesRes.json();
      setIssues(issuesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentProjectKey, refreshKey]);

  // Handle Drag & Drop status transition
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedIssueId(id);
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault();
    const issueId = draggedIssueId || e.dataTransfer.getData("text/plain");
    if (!issueId) return;

    setGovernanceWarning(null);
    const targetIssue = issues.find((i) => i.id === issueId);
    if (!targetIssue || targetIssue.statusId === targetStatusId) return;

    // Optimistically update
    const previousIssues = [...issues];
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId
          ? {
              ...i,
              statusId: targetStatusId,
              status: project.workflow.statuses.find((s: any) => s.id === targetStatusId) || i.status,
            }
          : i
      )
    );

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusId: targetStatusId,
          userRole: currentUserRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Rollback
        setIssues(previousIssues);
        setGovernanceWarning(data.error || "Workflow transition blocked by governance policy.");
      }
    } catch (err: any) {
      setIssues(previousIssues);
      setGovernanceWarning("Network error updating status.");
    } finally {
      setDraggedIssueId(null);
    }
  };

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    if (selectedType !== "ALL" && issue.type !== selectedType) return false;
    if (selectedAssignee !== "ALL" && issue.assigneeId !== selectedAssignee) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        issue.title.toLowerCase().includes(q) ||
        issue.key.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statuses = project?.workflow?.statuses || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "BUG":
        return <Bug className="h-3.5 w-3.5 text-rose-500" />;
      case "STORY":
        return <BookOpen className="h-3.5 w-3.5 text-emerald-500" />;
      case "EPIC":
        return <Flame className="h-3.5 w-3.5 text-purple-500" />;
      case "SUB_TASK":
        return <CheckSquare className="h-3.5 w-3.5 text-cyan-500" />;
      case "INCIDENT":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return <CheckSquare className="h-3.5 w-3.5 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      CRITICAL: "text-rose-600 bg-rose-50 dark:bg-rose-950/50",
      HIGH: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
      MEDIUM: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
      LOW: "text-slate-600 bg-slate-50 dark:bg-slate-800",
    };
    return (
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${colors[priority] || colors.MEDIUM}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Board Header Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-6 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              {project?.name || "Kanban Board"}
            </h1>
            <p className="text-xs text-slate-500">
              Drag cards across workflow columns. Transitions are strictly validated against role permissions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-500 mr-2">
              Total Items: <strong className="text-slate-800 dark:text-slate-200">{filteredIssues.length}</strong>
            </div>

            {/* Export CSV */}
            <a
              href={`/api/projects/${currentProjectKey}/export?format=csv`}
              download
              title="Export all project issues to CSV"
              className="flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <Download className="h-3.5 w-3.5 text-indigo-500" />
              <span>Export CSV</span>
            </a>

            {/* Import CSV */}
            <label
              htmlFor="import-csv-file"
              title="Import issues from CSV spreadsheet"
              className="flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5 text-indigo-500" />
              <span>{importing ? "Importing..." : "Import CSV"}</span>
              <input
                type="file"
                id="import-csv-file"
                accept=".csv"
                className="hidden"
                disabled={importing}
                onChange={handleImportCsv}
              />
            </label>
          </div>
        </div>

        {importMsg && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 px-3 py-1 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
            <span>{importMsg}</span>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, key..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="EPIC">Epics</option>
            <option value="STORY">Stories</option>
            <option value="TASK">Tasks</option>
            <option value="BUG">Bugs</option>
            <option value="SUB_TASK">Sub-tasks</option>
            <option value="INCIDENT">Incidents</option>
          </select>

          {/* Governance Alert Toast */}
          {governanceWarning && (
            <div className="flex items-center gap-2 rounded-md bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 px-3 py-1 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{governanceWarning}</span>
              <button
                onClick={() => setGovernanceWarning(null)}
                className="ml-2 font-bold hover:text-rose-900"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Kanban Board Columns Container */}
      <div className="flex-1 overflow-x-auto p-6 bg-slate-100/60 dark:bg-slate-950">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            Loading board items...
          </div>
        ) : (
          <div className="flex items-start gap-4 min-h-full pb-4">
            {statuses.map((status: any) => {
              const columnIssues = filteredIssues.filter(
                (i) => i.statusId === status.id
              );
              const columnPoints = columnIssues.reduce(
                (acc, curr) => acc + (curr.storyPoints || 0),
                0
              );

              return (
                <div
                  key={status.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status.id)}
                  className="flex flex-col w-80 flex-shrink-0 rounded-xl bg-slate-200/50 dark:bg-slate-900/60 border border-slate-300/60 dark:border-slate-800 max-h-[calc(100vh-11rem)] shadow-sm"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between p-3 border-b border-slate-300/40 dark:border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        {status.name}
                      </span>
                      <span className="rounded-full bg-slate-300/70 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        {columnIssues.length}
                      </span>
                    </div>
                    {columnPoints > 0 && (
                      <span className="text-[10px] font-medium text-slate-500">
                        {columnPoints} pts
                      </span>
                    )}
                  </div>

                  {/* Column Issue Cards */}
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                    {columnIssues.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 p-6 text-center text-xs text-slate-400">
                        Drop items here
                      </div>
                    ) : (
                      columnIssues.map((issue) => {
                        const sla = issue.slaResolveTarget
                          ? formatTimeRemaining(issue.slaResolveTarget)
                          : null;

                        return (
                          <div
                            key={issue.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, issue.id)}
                            onClick={() => setSelectedIssueId(issue.id)}
                            className="group relative rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-3 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition cursor-grab active:cursor-grabbing"
                          >
                            {/* Jira Level 1: Epic Link Pill */}
                            {issue.epic && (
                              <div className="mb-1.5 flex items-center">
                                <span className="inline-flex items-center gap-1 rounded bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 px-1.5 py-0.5 text-[9px] font-semibold text-purple-700 dark:text-purple-300 truncate max-w-full">
                                  <Zap className="h-2.5 w-2.5 text-purple-500 flex-shrink-0 fill-current" />
                                  <span className="truncate">{issue.epic.title || issue.epic.key}</span>
                                </span>
                              </div>
                            )}

                            {/* Jira Level 2: Parent Pill for Subtasks */}
                            {issue.parent && (
                              <div className="mb-1.5 flex items-center">
                                <span className="inline-flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 dark:text-blue-300 truncate max-w-full">
                                  <CheckSquare className="h-2.5 w-2.5 text-blue-500 flex-shrink-0" />
                                  <span className="truncate">{issue.parent.key}</span>
                                </span>
                              </div>
                            )}

                            {/* Card Top: Type & Key */}
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <div className="flex items-center gap-1.5">
                                {getTypeIcon(issue.type)}
                                <span className="font-mono text-[11px] font-bold text-slate-500 group-hover:text-indigo-600 transition">
                                  {issue.key}
                                </span>
                              </div>
                              {getPriorityBadge(issue.priority)}
                            </div>

                            {/* Card Title */}
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                              {issue.title}
                            </p>

                            {/* Card Bottom: SLA Timer, Points, Subtasks, Assignee */}
                            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {issue.storyPoints !== null && issue.storyPoints !== undefined && (
                                  <span className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                    {issue.storyPoints} pts
                                  </span>
                                )}

                                {/* Sub-task Progress Pill */}
                                {issue.subTasks && issue.subTasks.length > 0 && (
                                  <span
                                    title={`${issue.subTasks.filter((st: any) => st.status?.category === "DONE").length} of ${issue.subTasks.length} sub-tasks completed`}
                                    className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-700/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                                  >
                                    <CheckSquare className="h-2.5 w-2.5 text-indigo-500" />
                                    <span>
                                      {issue.subTasks.filter((st: any) => st.status?.category === "DONE").length}/{issue.subTasks.length}
                                    </span>
                                  </span>
                                )}

                                {sla && (
                                  <span
                                    className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                      sla.isBreached
                                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                        : sla.isWarning
                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                    }`}
                                  >
                                    <Clock className="h-2.5 w-2.5" />
                                    {sla.text}
                                  </span>
                                )}
                              </div>

                              {/* Assignee Avatar */}
                              {issue.assignee ? (
                                <div
                                  title={issue.assignee.name}
                                  className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold"
                                >
                                  {issue.assignee.name
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                                </div>
                              ) : (
                                <div className="h-5 w-5 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-[9px] text-slate-400">
                                  ?
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
