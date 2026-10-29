"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { formatTimeRemaining } from "@/lib/utils";
import {
  X,
  Clock,
  ShieldAlert,
  ArrowRight,
  MessageSquare,
  History,
  Send,
  Lock,
  User,
  AlertTriangle,
  CheckCircle,
  Tag,
  Paperclip,
  Download,
  Upload,
  FileText,
  GitBranch,
  GitCommit as GitCommitIcon,
  GitPullRequest as GitPullRequestIcon,
  ExternalLink,
  Timer,
  Calendar,
  PlusCircle,
  Flame,
  CheckSquare,
  Zap,
} from "lucide-react";

export default function IssueDetailModal() {
  const { selectedIssueId, setSelectedIssueId, currentUserRole, triggerRefresh } = useApp();

  const [issue, setIssue] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"comments" | "attachments" | "worklogs" | "audit">("comments");
  const [newComment, setNewComment] = useState<string>("");
  const [isInternalComment, setIsInternalComment] = useState<boolean>(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [showLogWorkModal, setShowLogWorkModal] = useState<boolean>(false);
  const [logHours, setLogHours] = useState<string>("");
  const [logDescription, setLogDescription] = useState<string>("");
  const [loggingWork, setLoggingWork] = useState<boolean>(false);
  const [availableEpics, setAvailableEpics] = useState<any[]>([]);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState<string>("");
  const [newSubTaskHours, setNewSubTaskHours] = useState<string>("");
  const [newSubTaskAssigneeId, setNewSubTaskAssigneeId] = useState<string>("");
  const [directEstimatedHours, setDirectEstimatedHours] = useState<string>("");
  const [storyPointsInput, setStoryPointsInput] = useState<string>("");
  const [addingSubTask, setAddingSubTask] = useState<boolean>(false);
  const [newChildTitle, setNewChildTitle] = useState<string>("");
  const [newChildType, setNewChildType] = useState<string>("STORY");
  const [addingChild, setAddingChild] = useState<boolean>(false);

  useEffect(() => {
    if (issue) {
      setDirectEstimatedHours(issue.estimatedHours?.toString() || "");
      setStoryPointsInput(issue.storyPoints?.toString() || "");
    }
  }, [issue?.id, issue?.estimatedHours, issue?.storyPoints]);

  const handleSaveDirectEstimate = async () => {
    if (!selectedIssueId || !issue) return;
    const val = directEstimatedHours.trim() ? parseFloat(directEstimatedHours) : null;
    if (val === (issue.estimatedHours || null)) return;

    setUpdating(true);
    try {
      await fetch(`/api/issues/${selectedIssueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimatedHours: val }),
      });
      fetchIssue();
      triggerRefresh();
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveStoryPoints = async () => {
    if (!selectedIssueId || !issue) return;
    const val = storyPointsInput.trim() ? parseInt(storyPointsInput, 10) : null;
    if (val === (issue.storyPoints || null)) return;

    setUpdating(true);
    try {
      await fetch(`/api/issues/${selectedIssueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyPoints: val }),
      });
      fetchIssue();
      triggerRefresh();
    } finally {
      setUpdating(false);
    }
  };

  const handleSubTaskAssigneeChange = async (subId: string, assigneeId: string) => {
    try {
      await fetch(`/api/issues/${subId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: assigneeId || null }),
      });
      fetchIssue();
      triggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEpicChange = async (epicId: string) => {
    if (!selectedIssueId) return;
    setUpdating(true);
    try {
      await fetch(`/api/issues/${selectedIssueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ epicId: epicId || null }),
      });
      fetchIssue();
      triggerRefresh();
    } finally {
      setUpdating(false);
    }
  };

  const handleAddSubTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTaskTitle.trim() || !issue) return;

    setAddingSubTask(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSubTaskTitle.trim(),
          type: "SUB_TASK",
          parentId: issue.id,
          projectId: issue.projectId,
          sprintId: issue.sprintId,
          priority: issue.priority || "MEDIUM",
          estimatedHours: newSubTaskHours ? parseFloat(newSubTaskHours) : undefined,
          assigneeId: newSubTaskAssigneeId || undefined,
        }),
      });
      if (res.ok) {
        setNewSubTaskTitle("");
        setNewSubTaskHours("");
        setNewSubTaskAssigneeId("");
        fetchIssue();
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingSubTask(false);
    }
  };

  const handleAddChildToEpic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildTitle.trim() || !issue) return;

    setAddingChild(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newChildTitle.trim(),
          type: newChildType,
          epicId: issue.id,
          projectId: issue.projectId,
          sprintId: issue.sprintId,
          priority: "MEDIUM",
        }),
      });
      if (res.ok) {
        setNewChildTitle("");
        fetchIssue();
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingChild(false);
    }
  };

  const handleToggleSubTaskStatus = async (sub: any) => {
    if (!issue?.project?.workflow?.statuses) return;
    const statuses = issue.project.workflow.statuses;
    const isDone = sub.status?.category === "DONE";

    const targetStatus = isDone
      ? statuses.find((s: any) => s.category === "TODO") || statuses[0]
      : statuses.find((s: any) => s.category === "DONE") || statuses[statuses.length - 1];

    if (!targetStatus) return;

    try {
      await fetch(`/api/issues/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId: targetStatus.id }),
      });
      fetchIssue();
      triggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logHours || !selectedIssueId) return;

    setLoggingWork(true);
    try {
      const res = await fetch(`/api/issues/${selectedIssueId}/worklogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeSpentHours: parseFloat(logHours),
          description: logDescription.trim(),
        }),
      });
      if (res.ok) {
        setLogHours("");
        setLogDescription("");
        setShowLogWorkModal(false);
        fetchIssue();
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingWork(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedIssueId) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("issueId", selectedIssueId);

    try {
      const res = await fetch("/api/attachments", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        fetchIssue();
        triggerRefresh();
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const handleSimulateCommit = async () => {
    if (!issue) return;
    try {
      const randomHash = Math.random().toString(36).substring(2, 9);
      await fetch("/api/webhooks/git", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "commit",
          hash: randomHash,
          message: `feat(core): performance update and refactoring refs ${issue.key}`,
          branch: `feature/${issue.key}-optimization`,
          authorName: "Elena Rostova",
          repoName: "acme-corp/governance-core",
          url: `https://github.com/acme-corp/governance-core/commit/${randomHash}`,
        }),
      });
      fetchIssue();
      triggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIssue = () => {
    if (!selectedIssueId) return;
    setLoading(true);
    fetch(`/api/issues/${selectedIssueId}`)
      .then((res) => res.json())
      .then((data) => {
        setIssue(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIssue();
  }, [selectedIssueId]);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      });
  }, []);

  useEffect(() => {
    if (issue?.project?.key) {
      fetch(`/api/issues?projectKey=${issue.project.key}&type=EPIC`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setAvailableEpics(data.filter((e: any) => e.id !== issue.id));
          }
        })
        .catch(console.error);
    }
  }, [issue?.id, issue?.project?.key]);

  if (!selectedIssueId) return null;

  // Handle workflow transition
  const handleTransition = async (targetStatusId: string) => {
    setUpdating(true);
    setTransitionError(null);

    try {
      const res = await fetch(`/api/issues/${selectedIssueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusId: targetStatusId,
          userRole: currentUserRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      fetchIssue();
      triggerRefresh();
    } catch (err: any) {
      setTransitionError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Handle assignee change
  const handleAssigneeChange = async (newAssigneeId: string) => {
    setUpdating(true);
    try {
      await fetch(`/api/issues/${selectedIssueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: newAssigneeId }),
      });
      fetchIssue();
      triggerRefresh();
    } finally {
      setUpdating(false);
    }
  };

  // Handle priority change
  const handlePriorityChange = async (newPriority: string) => {
    setUpdating(true);
    try {
      await fetch(`/api/issues/${selectedIssueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      fetchIssue();
      triggerRefresh();
    } finally {
      setUpdating(false);
    }
  };

  // Handle adding comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/issues/${selectedIssueId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: newComment.trim(),
          isInternal: isInternalComment,
        }),
      });

      if (res.ok) {
        setNewComment("");
        fetchIssue();
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const slaInfo = issue?.slaResolveTarget
    ? formatTimeRemaining(issue.slaResolveTarget)
    : null;

  const allowedTransitions = issue?.status?.fromTrans || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded">
              {issue?.key}
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {issue?.type}
            </span>

            {/* Parent Epic Pill (Level 1 link) */}
            {issue?.epic && (
              <button
                type="button"
                onClick={() => setSelectedIssueId(issue.epic.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900 transition"
                title={`Part of Epic: ${issue.epic.key} - ${issue.epic.title}`}
              >
                <Flame className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                <span className="max-w-[220px] truncate">{issue.epic.key}: {issue.epic.title}</span>
              </button>
            )}

            {/* Parent Issue Pill (Level 2 link for Sub-tasks) */}
            {issue?.parent && (
              <button
                type="button"
                onClick={() => setSelectedIssueId(issue.parent.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900 transition"
                title={`Sub-task of: ${issue.parent.key} - ${issue.parent.title}`}
              >
                <CheckSquare className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span className="max-w-[220px] truncate">Sub-task of {issue.parent.key}: {issue.parent.title}</span>
              </button>
            )}

            {/* SLA Status Pill */}
            {slaInfo && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  slaInfo.isBreached
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-300 dark:border-rose-800"
                    : slaInfo.isWarning
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-300 dark:border-amber-800"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>SLA: {slaInfo.text}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setSelectedIssueId(null)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Transition Error Alert */}
        {transitionError && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 text-rose-500" />
            <div className="flex-1">
              <span className="font-semibold">Governance Guard: </span>
              {transitionError}
            </div>
            <button
              onClick={() => setTransitionError(null)}
              className="text-rose-500 hover:text-rose-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content Body */}
        {loading || !issue ? (
          <div className="flex items-center justify-center p-12 text-xs text-slate-400">
            Loading work item details...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column (2 Cols): Details, Workflow transitions, Tabs */}
            <div className="md:col-span-2 space-y-5">
              {/* Title */}
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {issue.title}
                </h1>
              </div>

              {/* State Machine Workflow Actions Banner */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Current Status:
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                      style={{ backgroundColor: issue.status.color }}
                    >
                      {issue.status.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    Role: <strong className="text-indigo-600 dark:text-indigo-400">{currentUserRole}</strong>
                  </span>
                </div>

                {/* Transition Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    Available Transitions:
                  </span>
                  {allowedTransitions.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">
                      Terminal state (no further transitions defined)
                    </span>
                  ) : (
                    allowedTransitions.map((t: any) => {
                      const isRestricted =
                        t.requiredRole &&
                        currentUserRole !== t.requiredRole &&
                        currentUserRole !== "ADMIN";

                      return (
                        <button
                          key={t.id}
                          onClick={() => handleTransition(t.toStatus.id)}
                          disabled={updating}
                          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border transition shadow-sm ${
                            isRestricted
                              ? "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-75"
                              : "border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                          }`}
                        >
                          {t.name}
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: t.toStatus.color }}
                          />
                          {t.requiredRole && (
                            <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1 rounded">
                              {t.requiredRole}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Description
                </h3>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-3.5 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {issue.description || "No description provided."}
                </div>
              </div>

              {/* JIRA HIERARCHY LEVEL 1: If Epic, render child Stories & Tasks */}
              {issue.type === "EPIC" && (
                <div className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Issues in this Epic ({issue.childIssues?.length || 0})
                      </h3>
                    </div>
                    {issue.childIssues && issue.childIssues.length > 0 && (
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                        {issue.childIssues.filter((c: any) => c.status?.category === "DONE").length} of {issue.childIssues.length} completed ({Math.round((issue.childIssues.filter((c: any) => c.status?.category === "DONE").length / issue.childIssues.length) * 100)}%)
                      </span>
                    )}
                  </div>

                  {/* Aggregated Epic Progress Bar */}
                  {issue.childIssues && issue.childIssues.length > 0 && (
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all duration-300"
                        style={{
                          width: `${(issue.childIssues.filter((c: any) => c.status?.category === "DONE").length / issue.childIssues.length) * 100}%`,
                        }}
                      />
                    </div>
                  )}

                  {/* Child Items List */}
                  <div className="space-y-1.5 pt-1">
                    {!issue.childIssues || issue.childIssues.length === 0 ? (
                      <p className="text-xs text-slate-400 py-1 italic">
                        No stories or tasks attached to this epic yet. Add one below.
                      </p>
                    ) : (
                      issue.childIssues.map((child: any) => {
                        const isDone = child.status?.category === "DONE";
                        return (
                          <div
                            key={child.id}
                            onClick={() => setSelectedIssueId(child.id)}
                            className="group flex items-center justify-between p-2.5 rounded-lg border border-purple-100 dark:border-purple-900/40 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-600 transition cursor-pointer text-xs shadow-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 mr-3">
                              <span className="font-mono text-[11px] font-bold text-slate-500 group-hover:text-purple-600 transition">
                                {child.key}
                              </span>
                              <span
                                className={`truncate font-medium ${
                                  isDone
                                    ? "line-through text-slate-400 dark:text-slate-500"
                                    : "text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                {child.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                                style={{ backgroundColor: child.status?.color }}
                              >
                                {child.status?.name}
                              </span>
                              {child.assignee && (
                                <div
                                  title={child.assignee.name}
                                  className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold"
                                >
                                  {child.assignee.name
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Inline Add Child to Epic Form */}
                  <form onSubmit={handleAddChildToEpic} className="flex gap-2 pt-1.5">
                    <select
                      value={newChildType}
                      onChange={(e) => setNewChildType(e.target.value)}
                      className="rounded-md border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="STORY">Story</option>
                      <option value="TASK">Task</option>
                      <option value="BUG">Bug</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Add an issue to this epic (e.g. Design token renewal flow)..."
                      value={newChildTitle}
                      onChange={(e) => setNewChildTitle(e.target.value)}
                      className="flex-1 rounded-md border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={addingChild || !newChildTitle.trim()}
                      className="rounded-md bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition"
                    >
                      {addingChild ? "Adding..." : "+ Add Issue"}
                    </button>
                  </form>
                </div>
              )}

              {/* JIRA HIERARCHY LEVEL 2: If Story/Task/Bug (Standard Issue), render Sub-tasks checklist */}
              {issue.type !== "EPIC" && issue.type !== "SUB_TASK" && !issue.parentId && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-indigo-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Sub-tasks ({issue.subTasks?.length || 0})
                      </h3>
                    </div>
                    {issue.subTasks && issue.subTasks.length > 0 && (
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                        {issue.subTasks.filter((st: any) => st.status?.category === "DONE").length} of {issue.subTasks.length} completed ({Math.round((issue.subTasks.filter((st: any) => st.status?.category === "DONE").length / issue.subTasks.length) * 100)}%)
                      </span>
                    )}
                  </div>

                  {/* Subtasks Progress Bar */}
                  {issue.subTasks && issue.subTasks.length > 0 && (
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${(issue.subTasks.filter((st: any) => st.status?.category === "DONE").length / issue.subTasks.length) * 100}%`,
                        }}
                      />
                    </div>
                  )}

                  {/* Subtask Checklist Items */}
                  <div className="space-y-1.5 pt-1">
                    {!issue.subTasks || issue.subTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 py-1 italic">
                        No sub-tasks yet. Break this {issue.type.toLowerCase()} down into smaller action items below.
                      </p>
                    ) : (
                      issue.subTasks.map((sub: any) => {
                        const isDone = sub.status?.category === "DONE";
                        return (
                          <div
                            key={sub.id}
                            className="group flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-800 transition text-xs shadow-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 mr-3">
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => handleToggleSubTaskStatus(sub)}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span className="font-mono text-[11px] font-bold text-slate-500">
                                {sub.key}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedIssueId(sub.id)}
                                className={`text-left truncate font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition ${
                                  isDone
                                    ? "line-through text-slate-400 dark:text-slate-500"
                                    : "text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                {sub.title}
                              </button>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {(sub.estimatedHours || (sub.loggedHours || 0) > 0) && (
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/60" title={`Logged: ${sub.loggedHours || 0}h | Estimate: ${sub.estimatedHours || 0}h`}>
                                  {sub.loggedHours || 0}h / {sub.estimatedHours ? `${sub.estimatedHours}h` : "–"}
                                </span>
                              )}
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                                style={{ backgroundColor: sub.status?.color }}
                              >
                                {sub.status?.name}
                              </span>
                              <select
                                value={sub.assigneeId || ""}
                                onChange={(e) => handleSubTaskAssigneeChange(sub.id, e.target.value)}
                                className="text-[10px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-0.5 px-1 font-medium text-slate-700 dark:text-slate-300 focus:outline-none max-w-[110px] truncate"
                                title="Change sub-task assignee"
                              >
                                <option value="">Unassigned</option>
                                {users.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name} ({u.role})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Inline Add Sub-task Form with Assignee & Hours */}
                  <form onSubmit={handleAddSubTask} className="flex flex-wrap sm:flex-nowrap gap-2 pt-1.5">
                    <input
                      type="text"
                      placeholder="+ Add a sub-task (e.g. Write integration test)..."
                      value={newSubTaskTitle}
                      onChange={(e) => setNewSubTaskTitle(e.target.value)}
                      className="flex-1 min-w-[160px] rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={newSubTaskAssigneeId}
                      onChange={(e) => setNewSubTaskAssigneeId(e.target.value)}
                      className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none max-w-[140px] truncate"
                    >
                      <option value="">Assignee (Optional)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Est. hrs"
                      value={newSubTaskHours}
                      onChange={(e) => setNewSubTaskHours(e.target.value)}
                      className="w-16 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                    />
                    <button
                      type="submit"
                      disabled={addingSubTask || !newSubTaskTitle.trim()}
                      className="rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition flex-shrink-0"
                    >
                      {addingSubTask ? "Adding..." : "+ Add"}
                    </button>
                  </form>
                </div>
              )}

              {/* JIRA HIERARCHY LEVEL 3: If this item is a Sub-task, display parent context and link */}
              {(issue.type === "SUB_TASK" || issue.parentId) && (
                <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Parent Story Context (Level 2)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    This is a technical sub-task. In Jira&apos;s 3-level hierarchy, sub-tasks are the terminal execution layer and cannot have nested sub-tasks.
                  </p>
                  {issue.parent && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-blue-200 dark:border-blue-800/80 bg-white dark:bg-slate-900 shadow-xs">
                      <div className="flex items-center gap-2 min-w-0 mr-3">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          {issue.parent.key}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {issue.parent.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedIssueId(issue.parent.id)}
                        className="flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-500 transition flex-shrink-0"
                      >
                        <span>Open Parent Story</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Stream Tabs */}
              <div className="pt-2">
                <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      activeTab === "comments"
                        ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 pb-2 -mb-2"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Comments ({issue.comments?.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("attachments")}
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      activeTab === "attachments"
                        ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 pb-2 -mb-2"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>Attachments ({issue.attachments?.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("worklogs")}
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      activeTab === "worklogs"
                        ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 pb-2 -mb-2"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <Timer className="h-3.5 w-3.5" />
                    <span>Worklogs ({issue.worklogs?.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("audit")}
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      activeTab === "audit"
                        ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 pb-2 -mb-2"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>Audit Trail ({issue.auditLogs?.length || 0})</span>
                  </button>
                </div>

                {/* Tab: Comments */}
                {activeTab === "comments" && (
                  <div className="mt-4 space-y-4">
                    {/* Add comment box */}
                    <form onSubmit={handleAddComment} className="space-y-2">
                      <textarea
                        rows={2}
                        placeholder="Write a comment or resolution note..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isInternalComment}
                            onChange={(e) => setIsInternalComment(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <Lock className="h-3 w-3 text-amber-500" />
                          <span>Internal Agent Note (Hidden from Customer)</span>
                        </label>
                        <button
                          type="submit"
                          disabled={!newComment.trim()}
                          className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                        >
                          <Send className="h-3 w-3" />
                          <span>Post</span>
                        </button>
                      </div>
                    </form>

                    {/* List of comments */}
                    <div className="space-y-3 pt-2">
                      {issue.comments?.map((comment: any) => (
                        <div
                          key={comment.id}
                          className={`rounded-lg border p-3 text-xs ${
                            comment.isInternal
                              ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {comment.author?.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({comment.author?.role})
                              </span>
                              {comment.isInternal && (
                                <span className="rounded bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                                  Internal Note
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(comment.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {comment.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab: Attachments */}
                {activeTab === "attachments" && (
                  <div className="mt-4 space-y-4">
                    {/* Upload dropzone / button */}
                    <div className="rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 p-4 text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition bg-slate-50/50 dark:bg-slate-850">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center cursor-pointer space-y-1"
                      >
                        <Upload className="h-5 w-5 text-indigo-500 mb-1" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {uploadingFile ? "Uploading attachment..." : "Click to attach screenshot or file"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          PNG, JPG, PDF, ZIP, LOG files supported
                        </span>
                      </label>
                    </div>

                    {/* Attachment List */}
                    <div className="space-y-2">
                      {!issue.attachments || issue.attachments.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">
                          No files attached to this work item yet.
                        </p>
                      ) : (
                        issue.attachments.map((file: any) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 mr-3">
                              <FileText className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                              <div className="truncate">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {file.fileName}
                                </p>
                                <span className="text-[10px] text-slate-400">
                                  {Math.round(file.fileSize / 1024)} KB •{" "}
                                  {new Date(file.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            <a
                              href={file.fileUrl}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 transition flex-shrink-0"
                            >
                              <Download className="h-3 w-3" />
                              <span>Download</span>
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Worklogs & Time Tracking */}
                {activeTab === "worklogs" && (
                  <div className="mt-4 space-y-4">
                    {/* Log Work Form Trigger / Form */}
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Timer className="h-4 w-4 text-indigo-500" />
                          Log Work on {issue.key}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Total Logged: <strong className="text-indigo-600 dark:text-indigo-400">{issue.loggedHours || 0} hours</strong>
                        </span>
                      </div>

                      <form onSubmit={handleLogWork} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Time Spent (Hours) *
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            required
                            placeholder="e.g. 2.5"
                            value={logHours}
                            onChange={(e) => setLogHours(e.target.value)}
                            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Work Description / Activity
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="e.g. Implemented unit tests for JWT validator"
                              value={logDescription}
                              onChange={(e) => setLogDescription(e.target.value)}
                              className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              type="submit"
                              disabled={loggingWork || !logHours}
                              className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50"
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                              <span>Log</span>
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>

                    {/* Worklog History List */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                        Worklog Entries ({issue.worklogs?.length || 0})
                      </span>

                      {!issue.worklogs || issue.worklogs.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">
                          No work logged yet. Use the form above to log time.
                        </p>
                      ) : (
                        issue.worklogs.map((w: any) => (
                          <div
                            key={w.id}
                            className="flex items-start justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-xs"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                                {w.user?.name
                                  ?.split(" ")
                                  .map((n: string) => n[0])
                                  .join("") || "U"}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {w.user?.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    logged on {new Date(w.dateWorked).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 mt-1">
                                  {w.description || "Work completed"}
                                </p>
                              </div>
                            </div>

                            <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded text-xs flex-shrink-0">
                              {w.timeSpentHours}h
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Audit History */}
                {activeTab === "audit" && (
                  <div className="mt-4 space-y-2">
                    {issue.auditLogs?.map((log: any) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {log.user?.name || "System"}:
                          </span>
                          <span className="text-slate-500">
                            Changed <strong className="text-slate-700 dark:text-slate-300">{log.field}</strong> from{" "}
                            <span className="line-through text-slate-400">
                              {log.oldValue || "none"}
                            </span>{" "}
                            to{" "}
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                              {log.newValue}
                            </span>
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Metadata Attributes */}
            <div className="space-y-4 border-l border-slate-200 dark:border-slate-800 pl-6">
              {/* Assignee */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Assignee
                </label>
                <select
                  value={issue.assigneeId || ""}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Priority
                </label>
                <select
                  value={issue.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="BLOCKER">Blocker</option>
                </select>
              </div>

              {/* Epic Link (Level 1 Parent) - Only for Level 2 standard issues */}
              {issue.type !== "EPIC" && issue.type !== "SUB_TASK" && !issue.parentId && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Epic Link
                  </label>
                  <select
                    value={issue.epicId || ""}
                    onChange={(e) => handleEpicChange(e.target.value)}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">None (No Epic)</option>
                    {availableEpics.map((ep: any) => (
                      <option key={ep.id} value={ep.id}>
                        ⚡ {ep.key}: {ep.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Parent Story Display - If this is a subtask */}
              {(issue.type === "SUB_TASK" || issue.parentId) && issue.parent && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Parent Story
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelectedIssueId(issue.parent.id)}
                    className="flex items-center gap-1.5 w-full rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/40 p-2 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition text-left"
                  >
                    <CheckSquare className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                    <span className="truncate">{issue.parent.key}: {issue.parent.title}</span>
                  </button>
                </div>
              )}

              {/* Story Points (Direct Estimate) - Only for Epics and Standard Issues */}
              {issue.type !== "SUB_TASK" && !issue.parentId && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Story Points
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 5"
                      value={storyPointsInput}
                      onChange={(e) => setStoryPointsInput(e.target.value)}
                      onBlur={handleSaveStoryPoints}
                      className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {storyPointsInput && (
                      <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0">
                        pts
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Direct Estimate (Hours) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {issue.type === "SUB_TASK" ? "Sub-task Estimate (Hours)" : "Direct Estimate (Hours)"}
                  </label>
                  {issue.subTasks && issue.subTasks.length > 0 && (
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      Story only
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 16"
                    value={directEstimatedHours}
                    onChange={(e) => setDirectEstimatedHours(e.target.value)}
                    onBlur={handleSaveDirectEstimate}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0">
                    hrs
                  </span>
                </div>
              </div>

              {/* Jira-Style Aggregated Time Tracking with Σ Roll-Up */}
              {(() => {
                const isEpic = issue.type === "EPIC";
                const childIssues = issue.childIssues || [];
                const subTasks = issue.subTasks || [];
                const hasSubTasks = subTasks.length > 0;

                if (isEpic) {
                  const epicStoryPointsTotal = childIssues.reduce(
                    (sum: number, c: any) => sum + (c.storyPoints || 0),
                    0
                  );
                  const epicStoryPointsDone = childIssues
                    .filter((c: any) => c.status?.category === "DONE")
                    .reduce((sum: number, c: any) => sum + (c.storyPoints || 0), 0);

                  const directLogged = issue.loggedHours || 0;
                  const directEst = issue.estimatedHours || 0;

                  const childLogged = childIssues.reduce(
                    (sum: number, c: any) =>
                      sum +
                      (c.loggedHours || 0) +
                      (c.subTasks?.reduce((s: number, st: any) => s + (st.loggedHours || 0), 0) || 0),
                    0
                  );
                  const childEst = childIssues.reduce(
                    (sum: number, c: any) =>
                      sum +
                      (c.estimatedHours || 0) +
                      (c.subTasks?.reduce((s: number, st: any) => s + (st.estimatedHours || 0), 0) || 0),
                    0
                  );

                  const totalLogged = directLogged + childLogged;
                  const totalEst = directEst + childEst;

                  return (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1">
                          <span className="font-serif text-sm font-black">Σ</span>
                          <span>Epic Roll-Up</span>
                        </label>
                        <button
                          onClick={() => setActiveTab("worklogs")}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                        >
                          + Log Time
                        </button>
                      </div>

                      {/* Points Roll-up */}
                      <div className="rounded-lg bg-purple-50/70 dark:bg-purple-950/30 p-2.5 border border-purple-200 dark:border-purple-900/40 text-xs space-y-1.5">
                        <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                          <span>Story Points:</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            {epicStoryPointsDone} / {epicStoryPointsTotal} pts (
                            {epicStoryPointsTotal > 0
                              ? Math.round((epicStoryPointsDone / epicStoryPointsTotal) * 100)
                              : 0}
                            %)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                epicStoryPointsTotal > 0
                                  ? Math.min(100, (epicStoryPointsDone / epicStoryPointsTotal) * 100)
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Dev Hours Roll-up */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-300">
                            Σ {totalLogged}h logged
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {totalEst > 0 ? `Σ ${totalEst}h est.` : "No estimate"}
                          </span>
                        </div>

                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              totalLogged > totalEst && totalEst > 0 ? "bg-amber-500" : "bg-purple-600"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                totalEst > 0
                                  ? (totalLogged / totalEst) * 100
                                  : totalLogged > 0
                                  ? 100
                                  : 0
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                          {childIssues.length > 0
                            ? `Rolled up across ${childIssues.length} child issues`
                            : "Direct epic estimate (no child issues yet)"}
                        </p>
                      </div>
                    </div>
                  );
                }

                // Level 2 (Story / Task / Bug) or Level 3 (Sub-task)
                const directLogged = issue.loggedHours || 0;
                const directEst = issue.estimatedHours || 0;

                const subTasksLogged = subTasks.reduce(
                  (sum: number, st: any) => sum + (st.loggedHours || 0),
                  0
                );
                const subTasksEst = subTasks.reduce(
                  (sum: number, st: any) => sum + (st.estimatedHours || 0),
                  0
                );

                const totalLogged = directLogged + subTasksLogged;
                const totalEst =
                  subTasksEst > 0
                    ? directEst > 0
                      ? directEst + subTasksEst
                      : subTasksEst
                    : directEst;

                return (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        {hasSubTasks && (
                          <span className="font-serif text-sm font-black text-indigo-600 dark:text-indigo-400">
                            Σ
                          </span>
                        )}
                        <span>{hasSubTasks ? "Rolled-Up Time Tracking" : "Time Tracking"}</span>
                      </label>
                      <button
                        onClick={() => setActiveTab("worklogs")}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                      >
                        + Log Time
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">
                          {hasSubTasks ? `Σ ${totalLogged}h logged` : `${directLogged}h logged`}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {totalEst > 0
                            ? hasSubTasks
                              ? `Σ ${totalEst}h est.`
                              : `${directEst}h est.`
                            : "No estimate"}
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            totalLogged > totalEst && totalEst > 0 ? "bg-amber-500" : "bg-indigo-600"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              totalEst > 0
                                ? (totalLogged / totalEst) * 100
                                : totalLogged > 0
                                ? 100
                                : 0
                            )}%`,
                          }}
                        />
                      </div>

                      {hasSubTasks ? (
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>Story: {directLogged}h / {directEst > 0 ? `${directEst}h` : "–"}</span>
                          <span>
                            Sub-tasks ({subTasks.length}): {subTasksLogged}h / {subTasksEst > 0 ? `${subTasksEst}h` : "–"}
                          </span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">
                          Direct estimate (no sub-tasks attached)
                        </p>
                      )}

                      {/* Multi-Collaborator Logged Effort Breakdown */}
                      {(() => {
                        const allLogs = [
                          ...(issue.worklogs || []).map((w: any) => ({
                            user: w.user,
                            hours: w.timeSpentHours || 0,
                            source: "Story",
                          })),
                          ...subTasks.flatMap((st: any) =>
                            (st.worklogs || []).map((w: any) => ({
                              user: w.user,
                              hours: w.timeSpentHours || 0,
                              source: st.key,
                            }))
                          ),
                        ];

                        const userMap: Record<
                          string,
                          { name: string; role: string; hours: number; sources: string[] }
                        > = {};

                        allLogs.forEach((l) => {
                          const uid = l.user?.id || "unknown";
                          if (!userMap[uid]) {
                            userMap[uid] = {
                              name: l.user?.name || "Team Member",
                              role: l.user?.role || "DEV",
                              hours: 0,
                              sources: [],
                            };
                          }
                          userMap[uid].hours += l.hours;
                          if (!userMap[uid].sources.includes(l.source)) {
                            userMap[uid].sources.push(l.source);
                          }
                        });

                        const teamContributors = Object.values(userMap);
                        if (teamContributors.length === 0) return null;

                        return (
                          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                              Collaborator Worklogs ({teamContributors.length})
                            </span>
                            <div className="space-y-1 max-h-36 overflow-y-auto">
                              {teamContributors.map((c) => (
                                <div
                                  key={c.name}
                                  className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/60 text-[11px] border border-slate-100 dark:border-slate-800"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 mr-2">
                                    <div className="h-4 w-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                                      {c.name.split(" ").map((n) => n[0]).join("")}
                                    </div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                                      {c.name}
                                    </span>
                                    <span className="text-[9px] text-slate-400">({c.role})</span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0 font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                    <span>{c.hours}h</span>
                                    {c.sources.length > 0 && (
                                      <span className="text-[9px] text-slate-400 font-normal">
                                        ({c.sources.join(", ")})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}

              {/* Sprint */}
              {issue.sprint && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Sprint
                  </label>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {issue.sprint.name}
                  </span>
                </div>
              )}

              {/* Customer Contact */}
              {issue.customerEmail && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Customer Contact
                  </label>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 break-all">
                    {issue.customerEmail}
                  </span>
                </div>
              )}

              {/* Reporter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Reporter
                </label>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {issue.reporter?.name || "Alex Vance"}
                </span>
              </div>

              {/* Dynamic Custom Fields */}
              {issue.customFieldValues && issue.customFieldValues.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Custom Fields
                  </span>
                  {issue.customFieldValues.map((cfv: any) => (
                    <div key={cfv.id} className="text-xs">
                      <span className="text-slate-400 block text-[10px]">
                        {cfv.customField.name}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {cfv.value || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Development (Git Commits & Pull Requests) */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <GitBranch className="h-3.5 w-3.5 text-indigo-500" />
                    Development
                  </span>
                  <button
                    onClick={handleSimulateCommit}
                    title="Simulate git push with this issue key"
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    + Sim Commit
                  </button>
                </div>

                {/* Commits */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    Commits ({issue.gitCommits?.length || 0})
                  </span>
                  {(!issue.gitCommits || issue.gitCommits.length === 0) ? (
                    <p className="text-[11px] text-slate-400 italic">No commits linked</p>
                  ) : (
                    issue.gitCommits.map((c: any) => (
                      <div
                        key={c.id}
                        className="rounded bg-slate-50 dark:bg-slate-800/80 p-2 text-[11px] border border-slate-200 dark:border-slate-700/60"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {c.hash}
                          </span>
                          <span className="text-[9px] text-slate-400 truncate max-w-[100px]">
                            {c.branch}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
                          {c.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Pull Requests */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    Pull Requests ({issue.gitPullRequests?.length || 0})
                  </span>
                  {(!issue.gitPullRequests || issue.gitPullRequests.length === 0) ? (
                    <p className="text-[11px] text-slate-400 italic">No pull requests</p>
                  ) : (
                    issue.gitPullRequests.map((pr: any) => (
                      <div
                        key={pr.id}
                        className="rounded bg-slate-50 dark:bg-slate-800/80 p-2 text-[11px] border border-slate-200 dark:border-slate-700/60"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            #{pr.prNumber}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              pr.status === "MERGED"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                : pr.status === "OPEN"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {pr.status}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium truncate">
                          {pr.title}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
