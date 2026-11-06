"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Layers,
  ChevronDown,
  ChevronRight,
  Users,
  Target,
  Tag,
  Shield,
  HelpCircle,
} from "lucide-react";

type SwimlaneMode = "none" | "assignee" | "milestone" | "category" | "priority" | "collaborative";

export default function KanbanBoard() {
  const { currentProjectKey, setSelectedIssueId, refreshKey, currentUserRole } = useApp();

  const [project, setProject] = useState<any | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("ALL");
  const [selectedMilestone, setSelectedMilestone] = useState<string>("ALL");
  const [swimlaneMode, setSwimlaneMode] = useState<SwimlaneMode>("milestone");
  const [collapsedLanes, setCollapsedLanes] = useState<Record<string, boolean>>({});
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [governanceWarning, setGovernanceWarning] = useState<string | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const toggleLaneCollapse = (laneKey: string) => {
    setCollapsedLanes((prev) => ({ ...prev, [laneKey]: !prev[laneKey] }));
  };

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

  // Fetch project details and issues
  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, issuesRes] = await Promise.all([
        fetch(`/api/projects/${currentProjectKey}`),
        fetch(`/api/issues?projectKey=${currentProjectKey}`),
      ]);
      const projData = await projRes.json();
      setProject(projData);

      // Auto-set initial swimlane default based on project type
      if (projData.type === "RETAINER") {
        setSwimlaneMode("category");
      } else if (projData.type === "GREENFIELD_MILESTONE") {
        setSwimlaneMode("milestone");
      }

      const issuesData = await issuesRes.json();
      if (Array.isArray(issuesData)) setIssues(issuesData);
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
              status: project?.workflow?.statuses?.find((s: any) => s.id === targetStatusId) || i.status,
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

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (selectedType !== "ALL" && issue.type !== selectedType) return false;
      if (selectedAssignee !== "ALL") {
        const isAssigned = issue.assigneeId === selectedAssignee;
        const isCollaborator = issue.collaborators?.some((c: any) => c.userId === selectedAssignee);
        if (!isAssigned && !isCollaborator) return false;
      }
      if (selectedMilestone !== "ALL") {
        if (selectedMilestone === "NONE" && issue.milestoneId) return false;
        if (selectedMilestone !== "NONE" && issue.milestoneId !== selectedMilestone) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          issue.title.toLowerCase().includes(q) ||
          issue.key.toLowerCase().includes(q) ||
          issue.category?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [issues, selectedType, selectedAssignee, selectedMilestone, search]);

  const statuses = project?.workflow?.statuses || [];

  // Group issues into Swimlanes
  const swimlanes = useMemo(() => {
    if (swimlaneMode === "none") {
      return [{ id: "all", title: "All Issues", issues: filteredIssues, icon: Layers, meta: "" }];
    }

    if (swimlaneMode === "milestone") {
      const milestones = project?.milestones || [];
      const lanes: any[] = milestones.map((m: any) => ({
        id: m.id,
        title: m.title,
        status: m.status,
        issues: filteredIssues.filter((i) => i.milestoneId === m.id),
        icon: Target,
        meta: `${m.progressPercent || 0}% Complete • Target: ${new Date(m.targetDate).toLocaleDateString()}`,
      }));

      const noMilestoneIssues = filteredIssues.filter((i) => !i.milestoneId);
      if (noMilestoneIssues.length > 0 || milestones.length === 0) {
        lanes.push({
          id: "no-milestone",
          title: "Backlog / Unassigned to Milestone",
          issues: noMilestoneIssues,
          icon: Layers,
          meta: "General work pool",
        });
      }
      return lanes;
    }

    if (swimlaneMode === "assignee") {
      // Find all unique assignees
      const assigneeMap = new Map<string, any>();
      filteredIssues.forEach((issue) => {
        if (issue.assignee) {
          assigneeMap.set(issue.assignee.id, issue.assignee);
        }
      });

      const lanes: any[] = Array.from(assigneeMap.values()).map((user) => ({
        id: user.id,
        title: user.name,
        user,
        issues: filteredIssues.filter(
          (i) => i.assigneeId === user.id || i.collaborators?.some((c: any) => c.userId === user.id)
        ),
        icon: User,
        meta: user.role,
      }));

      const unassignedIssues = filteredIssues.filter((i) => !i.assigneeId && (!i.collaborators || i.collaborators.length === 0));
      if (unassignedIssues.length > 0 || lanes.length === 0) {
        lanes.push({
          id: "unassigned",
          title: "Unassigned Tasks",
          issues: unassignedIssues,
          icon: User,
          meta: "Awaiting task owner",
        });
      }
      return lanes;
    }

    if (swimlaneMode === "category") {
      const categories = Array.from(
        new Set(filteredIssues.map((i) => i.category || (project?.type === "RETAINER" ? "MAINTENANCE" : "GENERAL")))
      );

      return categories.map((cat) => ({
        id: cat,
        title: cat.toUpperCase(),
        issues: filteredIssues.filter((i) => (i.category || (project?.type === "RETAINER" ? "MAINTENANCE" : "GENERAL")) === cat),
        icon: Tag,
        meta: `${filteredIssues.filter((i) => (i.category || "GENERAL") === cat).length} items`,
      }));
    }

    if (swimlaneMode === "priority") {
      const priorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
      return priorities.map((p) => ({
        id: p,
        title: `${p} Priority`,
        issues: filteredIssues.filter((i) => i.priority === p),
        icon: AlertTriangle,
        meta: `${filteredIssues.filter((i) => i.priority === p).length} tasks`,
      }));
    }

    if (swimlaneMode === "collaborative") {
      return [
        {
          id: "collaborative",
          title: "Multi-User Collaborative Tasks",
          issues: filteredIssues.filter((i) => i.collaborators && i.collaborators.length > 0),
          icon: Users,
          meta: "Multiple team members co-assigned",
        },
        {
          id: "solo",
          title: "Individual Tasks",
          issues: filteredIssues.filter((i) => !i.collaborators || i.collaborators.length === 0),
          icon: User,
          meta: "Single assignee",
        },
      ];
    }

    return [{ id: "all", title: "All Issues", issues: filteredIssues, icon: Layers, meta: "" }];
  }, [swimlaneMode, filteredIssues, project]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "BUG":
        return <Bug className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />;
      case "STORY":
        return <BookOpen className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />;
      case "EPIC":
        return <Flame className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />;
      case "SUB_TASK":
        return <CheckSquare className="h-3.5 w-3.5 text-cyan-500 flex-shrink-0" />;
      case "INCIDENT":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />;
      default:
        return <CheckSquare className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      CRITICAL: "text-rose-600 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800",
      HIGH: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
      MEDIUM: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800",
      LOW: "text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    };
    return (
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${colors[priority] || colors.MEDIUM}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-100/70 dark:bg-slate-950">
      {/* Board Header Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 space-y-3 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white">
                {project?.name || "Kanban Delivery Board"}
              </h1>
              {project?.type === "GREENFIELD_MILESTONE" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  Greenfield Milestone Project
                </span>
              )}
              {project?.type === "RETAINER" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                  Retainer Project
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {project?.clientName ? `Client: ${project.clientName} • ` : ""}
              Drag cards across workflow columns. Transitions are strictly validated against role governance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-500 mr-2">
              Items: <strong className="text-slate-800 dark:text-slate-200">{filteredIssues.length}</strong>
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

        {/* Filter Controls & Swimlane Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search box */}
            <div className="relative w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search title, key, category..."
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
              <option value="TASK">Tasks</option>
              <option value="STORY">Stories</option>
              <option value="EPIC">Epics</option>
              <option value="BUG">Bugs</option>
              <option value="INCIDENT">Incidents</option>
              <option value="SUB_TASK">Sub-tasks</option>
            </select>

            {/* Milestone Filter if Greenfield */}
            {project?.milestones && project.milestones.length > 0 && (
              <select
                value={selectedMilestone}
                onChange={(e) => setSelectedMilestone(e.target.value)}
                className="rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Milestones</option>
                {project.milestones.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
                <option value="NONE">No Milestone</option>
              </select>
            )}
          </div>

          {/* Swimlane Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-500" />
              Swimlanes:
            </span>
            <select
              value={swimlaneMode}
              onChange={(e) => setSwimlaneMode(e.target.value as SwimlaneMode)}
              className="rounded-md border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="milestone">🎯 By Milestone (Greenfield)</option>
              <option value="assignee">👤 By Assignee / Member</option>
              <option value="category">🏷️ By Service Category (Retainer)</option>
              <option value="collaborative">👥 Collaborative vs Solo Tasks</option>
              <option value="priority">⚡ By Priority</option>
              <option value="none">None (Standard Board)</option>
            </select>
          </div>
        </div>

        {/* Governance Alert Toast */}
        {governanceWarning && (
          <div className="flex items-center gap-2 rounded-md bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 px-3 py-1.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 font-medium">{governanceWarning}</span>
            <button
              onClick={() => setGovernanceWarning(null)}
              className="font-bold hover:text-rose-900 dark:hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Kanban Board Canvas with Dynamic Swimlanes */}
      <div className="flex-1 overflow-y-auto overflow-x-auto p-6 space-y-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-xs text-slate-400">
            Loading board items and swimlanes...
          </div>
        ) : (
          swimlanes.map((lane) => {
            const isCollapsed = collapsedLanes[lane.id];
            const laneIssues = lane.issues || [];
            const lanePoints = laneIssues.reduce((acc: number, curr: any) => acc + (curr.storyPoints || 0), 0);
            const laneEstimatedHours = laneIssues.reduce((acc: number, curr: any) => acc + (curr.estimatedHours || 0), 0);
            const laneLoggedHours = laneIssues.reduce((acc: number, curr: any) => acc + (curr.loggedHours || 0), 0);
            const Icon = lane.icon || Layers;

            return (
              <div
                key={lane.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs backdrop-blur overflow-hidden transition"
              >
                {/* Swimlane Section Header */}
                <div
                  onClick={() => toggleLaneCollapse(lane.id)}
                  className="flex items-center justify-between px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-200 dark:border-slate-800 select-none transition"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {lane.title}
                      </span>
                      {lane.meta && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          ({lane.meta})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {laneIssues.length} tasks
                    </span>
                    {laneEstimatedHours > 0 && (
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {laneLoggedHours}h / {laneEstimatedHours}h logged
                      </span>
                    )}
                    {lanePoints > 0 && (
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                        {lanePoints} pts
                      </span>
                    )}
                  </div>
                </div>

                {/* Swimlane Status Columns */}
                {!isCollapsed && (
                  <div className="p-4 overflow-x-auto bg-slate-50/50 dark:bg-slate-950/40">
                    <div className="flex items-start gap-4 min-w-max pb-2">
                      {statuses.map((status: any) => {
                        const columnIssues = laneIssues.filter(
                          (i: any) => i.statusId === status.id
                        );

                        return (
                          <div
                            key={status.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, status.id)}
                            className="flex flex-col w-72 flex-shrink-0 rounded-lg bg-slate-200/50 dark:bg-slate-900/50 border border-slate-300/50 dark:border-slate-800 min-h-[160px] max-h-[500px] shadow-2xs"
                          >
                            {/* Column Header */}
                            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-300/40 dark:border-slate-800">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: status.color }}
                                />
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                  {status.name}
                                </span>
                              </div>
                              <span className="rounded-full bg-slate-300/60 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                                {columnIssues.length}
                              </span>
                            </div>

                            {/* Column Issue Cards */}
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                              {columnIssues.length === 0 ? (
                                <div className="h-20 rounded border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-[11px] text-slate-400">
                                  Drop here
                                </div>
                              ) : (
                                columnIssues.map((issue: any) => {
                                  const sla = issue.slaResolveTarget
                                    ? formatTimeRemaining(issue.slaResolveTarget)
                                    : null;

                                  const hasCollaborators = issue.collaborators && issue.collaborators.length > 0;

                                  return (
                                    <div
                                      key={issue.id}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, issue.id)}
                                      onClick={() => setSelectedIssueId(issue.id)}
                                      className="group relative rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-3 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition cursor-grab active:cursor-grabbing"
                                    >
                                      {/* Milestone Badge if attached */}
                                      {issue.milestone && swimlaneMode !== "milestone" && (
                                        <div className="mb-1.5 flex items-center">
                                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 truncate max-w-full">
                                            <Target className="h-2.5 w-2.5 text-emerald-500 flex-shrink-0" />
                                            <span className="truncate">{issue.milestone.title}</span>
                                          </span>
                                        </div>
                                      )}

                                      {/* Category / Scope Pill */}
                                      {issue.category && swimlaneMode !== "category" && (
                                        <div className="mb-1.5 flex items-center">
                                          <span className="inline-flex items-center gap-1 rounded bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 px-1.5 py-0.5 text-[9px] font-semibold text-purple-700 dark:text-purple-300 uppercase">
                                            <Tag className="h-2.5 w-2.5 text-purple-500 flex-shrink-0" />
                                            <span>{issue.category}</span>
                                          </span>
                                        </div>
                                      )}

                                      {/* Card Top: Type & Key & Priority */}
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

                                      {/* Hours progress bar if hours exist */}
                                      {issue.estimatedHours && (
                                        <div className="mt-2 space-y-1">
                                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                                            <span>Hours</span>
                                            <span>
                                              <strong>{issue.loggedHours || 0}</strong> / {issue.estimatedHours}h
                                            </span>
                                          </div>
                                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                              className={`h-full rounded-full transition-all ${
                                                (issue.loggedHours || 0) > issue.estimatedHours
                                                  ? "bg-rose-500"
                                                  : (issue.loggedHours || 0) >= issue.estimatedHours * 0.8
                                                  ? "bg-amber-500"
                                                  : "bg-indigo-500"
                                              }`}
                                              style={{
                                                width: `${Math.min(100, Math.round(((issue.loggedHours || 0) / issue.estimatedHours) * 100))}%`,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* Card Bottom: Points, Subtasks, SLA, Collaborative Avatars */}
                                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {issue.storyPoints !== null && issue.storyPoints !== undefined && (
                                            <span className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                              {issue.storyPoints} pts
                                            </span>
                                          )}

                                          {/* Sub-tasks count */}
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

                                        {/* Multi-User Collaborative Avatar Stack */}
                                        <div className="flex items-center -space-x-1.5">
                                          {issue.assignee && (
                                            <div
                                              title={`Primary Assignee: ${issue.assignee.name}`}
                                              className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold border border-white dark:border-slate-800 shadow-2xs z-10"
                                            >
                                              {issue.assignee.name
                                                .split(" ")
                                                .map((n: string) => n[0])
                                                .join("")}
                                            </div>
                                          )}

                                          {/* Collaborator Avatars */}
                                          {hasCollaborators &&
                                            issue.collaborators.map((c: any, idx: number) => {
                                              if (idx > 1) return null; // limit display to 2 co-assignees
                                              return (
                                                <div
                                                  key={c.id || idx}
                                                  title={`Collaborator: ${c.user?.name || "Team Member"} (${c.role || "Co-worker"})`}
                                                  className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px] font-bold border border-white dark:border-slate-800 shadow-2xs"
                                                >
                                                  {c.user?.name
                                                    ?.split(" ")
                                                    .map((n: string) => n[0])
                                                    .join("") || "C"}
                                                </div>
                                              );
                                            })}

                                          {hasCollaborators && issue.collaborators.length > 2 && (
                                            <div
                                              title={`${issue.collaborators.length - 2} more collaborators`}
                                              className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-[8px] font-bold border border-white dark:border-slate-800"
                                            >
                                              +{issue.collaborators.length - 2}
                                            </div>
                                          )}

                                          {!issue.assignee && !hasCollaborators && (
                                            <div className="h-5 w-5 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-[9px] text-slate-400">
                                              ?
                                            </div>
                                          )}
                                        </div>
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
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
