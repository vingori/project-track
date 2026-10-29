"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Plus,
  Play,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  MoveRight,
  Flame,
  Bug,
  BookOpen,
  CheckSquare,
  Zap,
} from "lucide-react";

export default function SprintBacklogView() {
  const { currentProjectKey, setSelectedIssueId, refreshKey, triggerRefresh } = useApp();

  const [project, setProject] = useState<any | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const projRes = await fetch(`/api/projects/${currentProjectKey}`);
      const projData = await projRes.json();
      setProject(projData);

      const issuesRes = await fetch(`/api/issues?projectKey=${currentProjectKey}`);
      const issuesData = await issuesRes.json();
      setIssues(issuesData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentProjectKey, refreshKey]);

  // Quick move issue to a sprint or backlog
  const handleMoveToSprint = async (issueId: string, sprintId: string | null) => {
    try {
      await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintId }),
      });
      fetchData();
      triggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const sprints = project?.sprints || [];
  const activeSprint = sprints.find((s: any) => s.status === "ACTIVE");
  const planningSprints = sprints.filter((s: any) => s.status === "PLANNING");
  const backlogIssues = issues.filter((i: any) => !i.sprintId);

  const getSprintIssues = (sprintId: string) =>
    issues.filter((i: any) => i.sprintId === sprintId);

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
      default:
        return <CheckSquare className="h-3.5 w-3.5 text-blue-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Backlog & Sprint Planning
            </h1>
            <p className="text-xs text-slate-500">
              Prioritize user stories, estimate effort points, and allocate scope into delivery sprints.
            </p>
          </div>
        </div>

        {/* ACTIVE SPRINT CONTAINER */}
        {activeSprint && (
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="flex flex-wrap items-center justify-between border-b border-indigo-100 dark:border-indigo-950 bg-indigo-50/50 dark:bg-indigo-950/30 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeSprint.name}
                </h2>
                <span className="rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5">
                  ACTIVE
                </span>
                {activeSprint.goal && (
                  <span className="text-xs text-slate-500 hidden md:inline">
                    • Goal: {activeSprint.goal}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {getSprintIssues(activeSprint.id).reduce(
                    (acc: number, curr: any) => acc + (curr.storyPoints || 0),
                    0
                  )}{" "}
                  pts
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500">
                  {getSprintIssues(activeSprint.id).length} issues
                </span>
              </div>
            </div>

            {/* Active Sprint Issue Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {getSprintIssues(activeSprint.id).map((issue: any) => (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  className="group flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-4">
                    {getTypeIcon(issue.type)}
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {issue.key}
                    </span>
                    {issue.epic && (
                      <span className="inline-flex items-center gap-1 rounded bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 px-1.5 py-0.5 text-[9px] font-semibold text-purple-700 dark:text-purple-300 max-w-[140px] truncate flex-shrink-0">
                        <Zap className="h-2.5 w-2.5 text-purple-500 flex-shrink-0 fill-current" />
                        <span className="truncate">{issue.epic.title || issue.epic.key}</span>
                      </span>
                    )}
                    {issue.parent && (
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 dark:text-blue-300 max-w-[140px] truncate flex-shrink-0">
                        <CheckSquare className="h-2.5 w-2.5 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{issue.parent.key}</span>
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                      {issue.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Subtasks counter */}
                    {issue.subTasks && issue.subTasks.length > 0 && (
                      <span
                        title={`${issue.subTasks.filter((st: any) => st.status?.category === "DONE").length} of ${issue.subTasks.length} sub-tasks completed`}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                      >
                        <CheckSquare className="h-2.5 w-2.5 text-indigo-500" />
                        <span>
                          {issue.subTasks.filter((st: any) => st.status?.category === "DONE").length}/{issue.subTasks.length}
                        </span>
                      </span>
                    )}
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                      style={{ backgroundColor: issue.status.color }}
                    >
                      {issue.status.name}
                    </span>
                    {issue.storyPoints !== null && (
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {issue.storyPoints}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveToSprint(issue.id, null);
                      }}
                      title="Move back to Backlog"
                      className="opacity-0 group-hover:opacity-100 text-[11px] text-slate-400 hover:text-indigo-600 transition"
                    >
                      To Backlog
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FUTURE / PLANNING SPRINTS */}
        {planningSprints.map((sprint: any) => (
          <div
            key={sprint.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-5 py-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {sprint.name}
                </h2>
                <span className="rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5">
                  PLANNING
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  {getSprintIssues(sprint.id).reduce(
                    (acc: number, curr: any) => acc + (curr.storyPoints || 0),
                    0
                  )}{" "}
                  pts
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {getSprintIssues(sprint.id).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Plan this sprint by dragging or moving items from the backlog below.
                </div>
              ) : (
                getSprintIssues(sprint.id).map((issue: any) => (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className="group flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-4">
                      {getTypeIcon(issue.type)}
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {issue.key}
                      </span>
                      {issue.epic && (
                        <span className="inline-flex items-center gap-1 rounded bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 px-1.5 py-0.5 text-[9px] font-semibold text-purple-700 dark:text-purple-300 max-w-[140px] truncate flex-shrink-0">
                          <Zap className="h-2.5 w-2.5 text-purple-500 flex-shrink-0 fill-current" />
                          <span className="truncate">{issue.epic.title || issue.epic.key}</span>
                        </span>
                      )}
                      {issue.parent && (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 dark:text-blue-300 max-w-[140px] truncate flex-shrink-0">
                          <CheckSquare className="h-2.5 w-2.5 text-blue-500 flex-shrink-0" />
                          <span className="truncate">{issue.parent.key}</span>
                        </span>
                      )}
                      <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                        {issue.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Subtasks counter */}
                      {issue.subTasks && issue.subTasks.length > 0 && (
                        <span
                          title={`${issue.subTasks.filter((st: any) => st.status?.category === "DONE").length} of ${issue.subTasks.length} sub-tasks completed`}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                        >
                          <CheckSquare className="h-2.5 w-2.5 text-indigo-500" />
                          <span>
                            {issue.subTasks.filter((st: any) => st.status?.category === "DONE").length}/{issue.subTasks.length}
                          </span>
                        </span>
                      )}
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                        style={{ backgroundColor: issue.status.color }}
                      >
                        {issue.status.name}
                      </span>
                      {issue.storyPoints !== null && (
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                          {issue.storyPoints}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveToSprint(issue.id, null);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[11px] text-slate-400 hover:text-indigo-600 transition"
                      >
                        To Backlog
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        {/* PRODUCT BACKLOG */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-5 py-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Product Backlog
              </h2>
              <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                {backlogIssues.length} items
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Total Backlog:{" "}
              {backlogIssues.reduce(
                (acc: number, curr: any) => acc + (curr.storyPoints || 0),
                0
              )}{" "}
              pts
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {backlogIssues.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No backlog items. Use the "Create" button [C] to add user stories.
              </div>
            ) : (
              backlogIssues.map((issue: any) => (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  className="group flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-4">
                    {getTypeIcon(issue.type)}
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {issue.key}
                    </span>
                    {issue.epic && (
                      <span className="inline-flex items-center gap-1 rounded bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 px-1.5 py-0.5 text-[9px] font-semibold text-purple-700 dark:text-purple-300 max-w-[140px] truncate flex-shrink-0">
                        <Zap className="h-2.5 w-2.5 text-purple-500 flex-shrink-0 fill-current" />
                        <span className="truncate">{issue.epic.title || issue.epic.key}</span>
                      </span>
                    )}
                    {issue.parent && (
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 dark:text-blue-300 max-w-[140px] truncate flex-shrink-0">
                        <CheckSquare className="h-2.5 w-2.5 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{issue.parent.key}</span>
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                      {issue.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Subtasks counter */}
                    {issue.subTasks && issue.subTasks.length > 0 && (
                      <span
                        title={`${issue.subTasks.filter((st: any) => st.status?.category === "DONE").length} of ${issue.subTasks.length} sub-tasks completed`}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                      >
                        <CheckSquare className="h-2.5 w-2.5 text-indigo-500" />
                        <span>
                          {issue.subTasks.filter((st: any) => st.status?.category === "DONE").length}/{issue.subTasks.length}
                        </span>
                      </span>
                    )}
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                      style={{ backgroundColor: issue.status.color }}
                    >
                      {issue.status.name}
                    </span>
                    {issue.storyPoints !== null && (
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {issue.storyPoints}
                      </span>
                    )}
                    {activeSprint && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveToSprint(issue.id, activeSprint.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 rounded bg-indigo-50 dark:bg-indigo-950 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition"
                      >
                        <span>Move to Active Sprint</span>
                        <MoveRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
