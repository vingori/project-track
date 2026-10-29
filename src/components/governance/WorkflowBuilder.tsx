"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  GitBranch,
  ShieldCheck,
  ArrowRight,
  Plus,
  Lock,
  Layers,
  CheckCircle2,
  Sliders,
  Webhook as WebhookIcon,
  Send,
  Clock,
  AlertCircle,
  Code,
} from "lucide-react";

export default function WorkflowBuilder() {
  const { currentProjectKey, refreshKey } = useApp();

  const [project, setProject] = useState<any | null>(null);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"workflow" | "fields" | "webhooks">("workflow");

  // Custom Field Form State
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("SELECT");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [isFieldSubmitting, setIsFieldSubmitting] = useState(false);

  // Webhook Form State
  const [newWebhookName, setNewWebhookName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, cfRes, whRes] = await Promise.all([
        fetch(`/api/projects/${currentProjectKey}`),
        fetch(`/api/projects/${currentProjectKey}/custom-fields`),
        fetch(`/api/projects/${currentProjectKey}/webhooks`),
      ]);
      const projData = await projRes.json();
      const cfData = await cfRes.json();
      const whData = await whRes.json();

      setProject(projData);
      if (Array.isArray(cfData)) setCustomFields(cfData);
      if (Array.isArray(whData)) setWebhooks(whData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentProjectKey, refreshKey]);

  // Handle Create Custom Field
  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    setIsFieldSubmitting(true);
    try {
      let optionsJson: string | null = null;
      if (newFieldType === "SELECT" && newFieldOptions.trim()) {
        optionsJson = JSON.stringify(
          newFieldOptions.split(",").map((o) => o.trim()).filter(Boolean)
        );
      }

      const res = await fetch(`/api/projects/${currentProjectKey}/custom-fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFieldName.trim(),
          fieldType: newFieldType,
          optionsJson,
        }),
      });

      if (res.ok) {
        setNewFieldName("");
        setNewFieldOptions("");
        fetchData();
      }
    } finally {
      setIsFieldSubmitting(false);
    }
  };

  // Handle Create Webhook
  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) return;

    try {
      const res = await fetch(`/api/projects/${currentProjectKey}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWebhookName.trim(),
          url: newWebhookUrl.trim(),
          events: "ISSUE_CREATED,STATUS_CHANGED,SLA_BREACHED",
        }),
      });

      if (res.ok) {
        setNewWebhookName("");
        setNewWebhookUrl("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Send Test Ping
  const handleTestWebhook = async () => {
    setTestStatus("Dispatching test payload...");
    try {
      const res = await fetch(`/api/projects/${currentProjectKey}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      if (res.ok) {
        setTestStatus("Test payload sent! Check delivery logs below.");
        setTimeout(() => {
          fetchData();
          setTestStatus(null);
        }, 1500);
      }
    } catch {
      setTestStatus("Failed to send test payload.");
    }
  };

  if (loading || !project) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs text-slate-400">
        Loading governance configuration...
      </div>
    );
  }

  const workflow = project.workflow;
  const statuses = workflow?.statuses || [];
  const transitions = workflow?.transitions || [];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Project Governance & Customization Hub
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              State-machine rules, dynamic custom fields, and real-time webhook automation for [{project.key}].
            </p>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 text-xs">
            <button
              onClick={() => setActiveTab("workflow")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
                activeTab === "workflow"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>State Machine</span>
            </button>
            <button
              onClick={() => setActiveTab("fields")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
                activeTab === "fields"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Custom Fields ({customFields.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("webhooks")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
                activeTab === "webhooks"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <WebhookIcon className="h-3.5 w-3.5" />
              <span>Webhooks & Alerts ({webhooks.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: WORKFLOW STATE MACHINE */}
        {activeTab === "workflow" && (
          <div className="space-y-6">
            {/* Status Pipeline Visualizer */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Workflow Lifecycle Pipeline ({statuses.length} States)
                </h3>
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                  {workflow?.name}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 py-2">
                {statuses.map((s: any, idx: number) => (
                  <React.Fragment key={s.id}>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {s.name}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          {s.category}
                        </div>
                      </div>
                    </div>
                    {idx < statuses.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Allowed Transitions Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-5 py-3.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Configured Transition Guards & RBAC Restrictions
                </h3>
                <p className="text-xs text-slate-500">
                  Only actions matching these transition rules can be executed by team members.
                </p>
              </div>

              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-4">Transition Action</th>
                    <th className="py-2.5 px-4">From State</th>
                    <th className="py-2.5 px-4">To State</th>
                    <th className="py-2.5 px-4">Access Restriction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transitions.map((t: any) => {
                    const fromStatus = statuses.find((s: any) => s.id === t.fromStatusId);
                    const toStatus = statuses.find((s: any) => s.id === t.toStatusId);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {t.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: fromStatus?.color }}
                            />
                            {fromStatus?.name || "Any"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: toStatus?.color }}
                            />
                            {toStatus?.name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {t.requiredRole ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                              <Lock className="h-3 w-3" />
                              Strict: Requires {t.requiredRole}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Any project member
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DYNAMIC CUSTOM FIELDS BUILDER */}
        {activeTab === "fields" && (
          <div className="space-y-6">
            {/* Add Field Form */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Add Project Custom Field
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Define specialized metadata attributes for this project's work items.
              </p>

              <form onSubmit={handleCreateField} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Field Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deployment Environment"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Type
                  </label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SELECT">Dropdown List (Select)</option>
                    <option value="TEXT">Short Text</option>
                    <option value="NUMBER">Number</option>
                    <option value="CHECKBOX">Boolean / Checkbox</option>
                    <option value="DATE">Date Picker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Options (comma-separated if Select)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Staging, Production, Canary"
                    disabled={newFieldType !== "SELECT"}
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={isFieldSubmitting || !newFieldName.trim()}
                    className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Custom Field</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Custom Fields List */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-5 py-3.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Custom Fields ({customFields.length})
                </h3>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {customFields.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No custom fields configured for this project yet.
                  </div>
                ) : (
                  customFields.map((field) => {
                    let parsedOptions: string[] = [];
                    try {
                      if (field.optionsJson) parsedOptions = JSON.parse(field.optionsJson);
                    } catch {}

                    return (
                      <div
                        key={field.id}
                        className="flex flex-wrap items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {field.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              key: {field.key}
                            </span>
                          </div>
                          {parsedOptions.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {parsedOptions.map((opt) => (
                                <span
                                  key={opt}
                                  className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300"
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <span className="rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 text-[10px] font-bold">
                          {field.fieldType}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WEBHOOKS & NOTIFICATIONS */}
        {activeTab === "webhooks" && (
          <div className="space-y-6">
            {/* Create Webhook Form */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Add Outgoing Webhook / Slack Alert
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dispatch real-time JSON payloads to Slack, Discord, CI/CD, or your cloud microservices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  className="flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <Send className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Send Test Ping</span>
                </button>
              </div>

              {testStatus && (
                <div className="mb-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 p-2.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                  {testStatus}
                </div>
              )}

              <form onSubmit={handleCreateWebhook} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Webhook Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Slack Incident Alert Channel"
                    value={newWebhookName}
                    onChange={(e) => setNewWebhookName(e.target.value)}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Endpoint URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.acme-corp.internal/webhooks/alerts"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Save Webhook</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Configured Webhooks & Delivery Logs */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Active Webhooks & Recent Delivery Audit Logs
              </h3>

              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {wh.name}
                      </h4>
                      <p className="font-mono text-[10px] text-slate-400 truncate max-w-md">
                        {wh.url}
                      </p>
                    </div>
                    <span className="rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5">
                      ACTIVE
                    </span>
                  </div>

                  {/* Delivery History */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Recent Delivery Log
                    </span>
                    {wh.deliveries?.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No delivery attempts yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {wh.deliveries.map((d: any) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between text-[11px] p-2 rounded bg-slate-50 dark:bg-slate-800/60"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                  d.statusCode && d.statusCode < 300
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                }`}
                              >
                                {d.statusCode || 500}
                              </span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {d.event}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {d.durationMs}ms • {new Date(d.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
