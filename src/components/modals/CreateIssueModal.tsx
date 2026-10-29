"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { X, Sparkles, AlertCircle, Clock, Check } from "lucide-react";
import { IssueType, Priority } from "@/types";

export default function CreateIssueModal() {
  const { isCreateModalOpen, setIsCreateModalOpen, currentProjectKey, triggerRefresh } = useApp();

  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<IssueType>("TASK");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [storyPoints, setStoryPoints] = useState<string>("");
  const [estimatedHours, setEstimatedHours] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [epics, setEpics] = useState<any[]>([]);
  const [selectedEpicId, setSelectedEpicId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedProjectId) return;
    const proj = projects.find((p) => p.id === selectedProjectId);
    if (proj?.key) {
      fetch(`/api/issues?projectKey=${proj.key}&type=EPIC`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setEpics(data);
        })
        .catch(console.error);
    }
  }, [selectedProjectId, projects]);

  useEffect(() => {
    if (!isCreateModalOpen) return;

    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
          const current = data.find((p) => p.key === currentProjectKey) || data[0];
          if (current) {
            setSelectedProjectId(current.id);
            if (current.type === "SUPPORT_DESK") {
              setSelectedType("INCIDENT");
            } else {
              setSelectedType("STORY");
            }
          }
        }
      });

    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      });
  }, [isCreateModalOpen, currentProjectKey]);

  if (!isCreateModalOpen) return null;

  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const isSupport = currentProject?.type === "SUPPORT_DESK";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedProjectId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title: title.trim(),
          description: description.trim(),
          type: selectedType,
          priority,
          assigneeId: assigneeId || undefined,
          epicId: selectedEpicId || undefined,
          storyPoints: storyPoints ? parseInt(storyPoints, 10) : undefined,
          estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
          customerEmail: customerEmail.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create issue");
      }

      // Reset and close
      setTitle("");
      setDescription("");
      setSelectedEpicId("");
      setStoryPoints("");
      setEstimatedHours("");
      setCustomerEmail("");
      setIsCreateModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Create New Work Item
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Create stories, tasks, bugs, or support incident tickets.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Project & Type Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project *
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.key}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Issue Type *
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as IssueType)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {!isSupport ? (
                  <>
                    <option value="STORY">Story</option>
                    <option value="TASK">Task</option>
                    <option value="BUG">Bug</option>
                    <option value="EPIC">Epic</option>
                  </>
                ) : (
                  <>
                    <option value="INCIDENT">Incident (SLA Timed)</option>
                    <option value="SERVICE_REQUEST">Service Request</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Epic Link (Optional for Stories, Tasks, Bugs) */}
          {!isSupport && selectedType !== "EPIC" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Parent Epic (Optional)
              </label>
              <select
                value={selectedEpicId}
                onChange={(e) => setSelectedEpicId(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None (No Epic)</option>
                {epics.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    ⚡ [{ep.key}] {ep.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Title / Summary *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Implement webhook retry backoff policy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Reproduction Steps
            </label>
            <textarea
              rows={4}
              placeholder="Add detailed acceptance criteria or technical context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Priority & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical (Immediate SLA)</option>
                <option value="BLOCKER">Blocker</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

          {/* Support Ticket specific: Customer Email */}
          {isSupport ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Email (SLA Notification)
              </label>
              <input
                type="email"
                placeholder="customer@enterprise.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Story Points (Fibonacci: 1, 2, 3, 5, 8, 13)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  min="0"
                  max="100"
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Hours (Direct estimate)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 16"
                  min="0"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <span>Creating...</span>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Create Item</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
