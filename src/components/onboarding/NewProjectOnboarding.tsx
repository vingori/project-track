"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  Target,
  Repeat,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Calendar,
  Clock,
  DollarSign,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Briefcase,
  AlertCircle,
} from "lucide-react";

export default function NewProjectOnboarding() {
  const router = useRouter();
  const { setCurrentProjectKey, triggerRefresh } = useApp();

  const [step, setStep] = useState<number>(1);
  const [users, setUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [projectType, setProjectType] = useState<"GREENFIELD_MILESTONE" | "RETAINER">("GREENFIELD_MILESTONE");
  const [name, setName] = useState<string>("");
  const [key, setKey] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [leadId, setLeadId] = useState<string>("");

  // Greenfield State
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [targetDate, setTargetDate] = useState<string>(
    new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0]
  );
  const [budgetHours, setBudgetHours] = useState<string>("320");
  const [budgetAmount, setBudgetAmount] = useState<string>("48000");
  const [milestones, setMilestones] = useState<Array<{ title: string; targetDate: string; estimatedHours: string; description: string }>>([
    {
      title: "Phase 1: Discovery & Architecture Blueprint",
      targetDate: new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0],
      estimatedHours: "60",
      description: "Technical requirements, system design, and security architecture.",
    },
    {
      title: "Phase 2: Core Microservices & Database Implementation",
      targetDate: new Date(Date.now() + 50 * 86400000).toISOString().split("T")[0],
      estimatedHours: "140",
      description: "API implementation, persistent data models, and backend business logic.",
    },
    {
      title: "Phase 3: UAT, Penetration Testing & Production Launch",
      targetDate: new Date(Date.now() + 85 * 86400000).toISOString().split("T")[0],
      estimatedHours: "120",
      description: "End-to-end integration testing, client signoff, and traffic cutover.",
    },
  ]);

  // Retainer State
  const [retainerHours, setRetainerHours] = useState<string>("40");
  const [retainerPeriod, setRetainerPeriod] = useState<string>("MONTHLY");
  const [retainerRolloverHours, setRetainerRolloverHours] = useState<string>("5");
  const [retainerRolloverCap, setRetainerRolloverCap] = useState<string>("10");
  const [retainerHourlyRate, setRetainerHourlyRate] = useState<string>("185");
  const [retainerOverageRate, setRetainerOverageRate] = useState<string>("240");

  // Team Allocation
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Kickoff Checklist
  const [checklist, setChecklist] = useState<Array<{ text: string; completed: boolean }>>([
    { text: "Executed Master Services Agreement & Statement of Work", completed: true },
    { text: "Designated client point of contact & communications channel", completed: true },
    { text: "Cloud infrastructure access & IAM credentials provisioned", completed: false },
    { text: "Weekly stakeholder progress sync cadence scheduled", completed: false },
  ]);

  // Initial Kickoff Tasks
  const [createInitialTasks, setCreateInitialTasks] = useState<boolean>(true);

  // Fetch users for lead and team allocation
  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
          if (data.length > 0) {
            setLeadId(data[0].id);
            setSelectedUserIds(data.map((u) => u.id));
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Auto-generate project key
  const handleNameChange = (val: string) => {
    setName(val);
    if (!key || key === name.substring(0, 4).toUpperCase()) {
      const generated = val.replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase();
      if (generated) setKey(generated);
    }
  };

  const handleAddMilestone = () => {
    setMilestones([
      ...milestones,
      {
        title: `Phase ${milestones.length + 1}: New Milestone`,
        targetDate: new Date(Date.now() + (milestones.length + 1) * 30 * 86400000).toISOString().split("T")[0],
        estimatedHours: "40",
        description: "",
      },
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleToggleChecklist = (index: number) => {
    setChecklist(
      checklist.map((item, i) => (i === index ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Project Name is required.");
      setStep(2);
      return;
    }
    if (!key.trim()) {
      setError("Project Key is required.");
      setStep(2);
      return;
    }

    setSubmitting(true);

    try {
      // Build initial tasks
      let initialIssues: any[] = [];
      if (createInitialTasks) {
        if (projectType === "GREENFIELD_MILESTONE") {
          initialIssues = [
            {
              title: "Setup Cloud Repository & CI/CD Pipeline",
              type: "TASK",
              priority: "HIGH",
              category: "DEVOPS",
              estimatedHours: 16,
              description: "Configure GitHub/GitLab repository, trunk branching model, and preview environments.",
            },
            {
              title: "Technical Discovery & API Specification Document",
              type: "STORY",
              priority: "CRITICAL",
              category: "ARCHITECTURE",
              estimatedHours: 24,
              description: "Draft OpenAPI 3.0 specification and data flow diagram for client review.",
            },
          ];
        } else {
          initialIssues = [
            {
              title: "Initial Infrastructure Security & Vulnerability Audit",
              type: "TASK",
              priority: "CRITICAL",
              category: "MAINTENANCE",
              estimatedHours: 12,
              description: "Baseline audit of cloud assets, IAM policies, and open CVE vulnerabilities.",
            },
            {
              title: "Configure PagerDuty SLA Monitoring & Alert Bridge",
              type: "TASK",
              priority: "HIGH",
              category: "SLA",
              estimatedHours: 8,
              description: "Setup incident escalation paths and health check synthetic pingers.",
            },
          ];
        }
      }

      const payload = {
        name: name.trim(),
        key: key.trim().toUpperCase(),
        clientName: clientName.trim() || null,
        description: description.trim() || null,
        type: projectType,
        leadId: leadId || null,
        startDate,
        targetDate: projectType === "GREENFIELD_MILESTONE" ? targetDate : null,
        budgetHours: projectType === "GREENFIELD_MILESTONE" ? budgetHours : null,
        budgetAmount: projectType === "GREENFIELD_MILESTONE" ? budgetAmount : null,
        retainerHours: projectType === "RETAINER" ? retainerHours : null,
        retainerPeriod: projectType === "RETAINER" ? retainerPeriod : null,
        retainerRolloverHours: projectType === "RETAINER" ? retainerRolloverHours : 0,
        retainerRolloverCap: projectType === "RETAINER" ? retainerRolloverCap : 0,
        retainerHourlyRate: projectType === "RETAINER" ? retainerHourlyRate : null,
        retainerOverageRate: projectType === "RETAINER" ? retainerOverageRate : null,
        initialMilestones: projectType === "GREENFIELD_MILESTONE" ? milestones : [],
        kickoffChecklist: checklist,
        initialIssues,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setCurrentProjectKey(data.key);
      triggerRefresh();
      router.push(`/projects/${data.key}/board`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during onboarding.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Onboarding Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>New Project Onboarding Wizard</span>
            </h1>
            <p className="text-xs text-slate-500">
              Configure project typology (Greenfield Milestone vs Retainer), deliverables, team allocation, and kickoff checklists.
            </p>
          </div>

          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          >
            Cancel & Return
          </Link>
        </div>

        {/* Multi-step Stepper Indicator */}
        <div className="grid grid-cols-5 gap-2 text-xs">
          {[
            { s: 1, label: "1. Typology" },
            { s: 2, label: "2. Identity" },
            { s: 3, label: projectType === "GREENFIELD_MILESTONE" ? "3. Milestones" : "3. Retainer Config" },
            { s: 4, label: "4. Team Allocation" },
            { s: 5, label: "5. Launch" },
          ].map((item) => (
            <button
              key={item.s}
              onClick={() => item.s < step && setStep(item.s)}
              className={`p-2.5 rounded-lg border text-left font-semibold transition ${
                step === item.s
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-2xs"
                  : step > item.s
                  ? "border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 p-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: TYPOLOGY SELECTION */}
        {step === 1 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Select Project Typology
              </h2>
              <p className="text-xs text-slate-500">
                Choose the operating model and delivery structure for this initiative.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Greenfield Milestone */}
              <div
                onClick={() => setProjectType("GREENFIELD_MILESTONE")}
                className={`p-5 rounded-xl border-2 cursor-pointer transition space-y-3 ${
                  projectType === "GREENFIELD_MILESTONE"
                    ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Target className="h-5 w-5" />
                  </div>
                  {projectType === "GREENFIELD_MILESTONE" && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Greenfield Milestone Project
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Fixed scope or phase-gated initiatives. Built around sequential milestone deadlines, deliverable checklists, and budget tracking.
                  </p>
                </div>

                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Milestone phase gateways (Discovery, Alpha, Launch)
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Budget hours & deliverable completion %
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Milestone-grouped Swimlane boards
                  </li>
                </ul>
              </div>

              {/* Option B: Retainer Style */}
              <div
                onClick={() => setProjectType("RETAINER")}
                className={`p-5 rounded-xl border-2 cursor-pointer transition space-y-3 ${
                  projectType === "RETAINER"
                    ? "border-purple-600 bg-purple-50/40 dark:bg-purple-950/30 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Repeat className="h-5 w-5" />
                  </div>
                  {projectType === "RETAINER" && (
                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Retainer Style Project
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Recurring monthly or quarterly service agreements. Built around contracted hour allowances, rollover hours, overage rates, and SLA queues.
                  </p>
                </div>

                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    Monthly contracted hours & rollover allowance
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    Burn-down tracker & overage rate billing
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    Recurring work categories (SRE, Security, SLA)
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-xs font-semibold transition"
              >
                <span>Continue to Project Identity</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PROJECT IDENTITY */}
        {step === 2 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Project Profile & Client Identity
              </h2>
              <p className="text-xs text-slate-500">
                Define the project name, unique key code, client account, and lead.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apollo Cloud Infrastructure Migration"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Project Key (Prefix) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. APOL"
                  value={key}
                  maxLength={6}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Client / Account Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Astra Dynamics Aerospace"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Project Lead
                </label>
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Project Objectives & Scope Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly state the deliverable scope, operational SLA requirements, or business goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-xs font-semibold transition"
              >
                <span>Continue to {projectType === "GREENFIELD_MILESTONE" ? "Milestones" : "Retainer Setup"}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3A: GREENFIELD MILESTONES */}
        {step === 3 && projectType === "GREENFIELD_MILESTONE" && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-600" />
                  <span>Greenfield Milestones & Deliverable Roadmap</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Configure phase deliverables, target deadlines, and estimated budget hours.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddMilestone}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Milestone Phase</span>
              </button>
            </div>

            {/* Overall Schedule & Budget Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 block">Kickoff Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Target Launch Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="mt-1 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Total Budget (Hours)</label>
                <input
                  type="number"
                  value={budgetHours}
                  onChange={(e) => setBudgetHours(e.target.value)}
                  className="mt-1 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Total Budget ($ USD)</label>
                <input
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="mt-1 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs"
                />
              </div>
            </div>

            {/* Milestones List */}
            <div className="space-y-3">
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Phase {idx + 1} Gateway
                    </span>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(idx)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 block mb-0.5">Milestone Title</label>
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[idx].title = e.target.value;
                          setMilestones(updated);
                        }}
                        className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Target Date</label>
                      <input
                        type="date"
                        value={m.targetDate}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[idx].targetDate = e.target.value;
                          setMilestones(updated);
                        }}
                        className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 block mb-0.5">Scope & Deliverables</label>
                      <input
                        type="text"
                        placeholder="Deliverable specifications, signoff criteria..."
                        value={m.description}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[idx].description = e.target.value;
                          setMilestones(updated);
                        }}
                        className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Estimated Hours</label>
                      <input
                        type="number"
                        value={m.estimatedHours}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[idx].estimatedHours = e.target.value;
                          setMilestones(updated);
                        }}
                        className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-xs font-semibold transition"
              >
                <span>Continue to Team Allocation</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3B: RETAINER CONFIGURATION */}
        {step === 3 && projectType === "RETAINER" && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Repeat className="h-4 w-4 text-purple-600" />
                <span>Retainer Agreement & Billing Cycle Setup</span>
              </h2>
              <p className="text-xs text-slate-500">
                Configure contracted monthly hours, rollover limits, and overage billing rates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contracted Hours / Month *
                </label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="number"
                    value={retainerHours}
                    onChange={(e) => setRetainerHours(e.target.value)}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Billing Cycle
                </label>
                <select
                  value={retainerPeriod}
                  onChange={(e) => setRetainerPeriod(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="MONTHLY">Monthly (1st to end-of-month)</option>
                  <option value="QUARTERLY">Quarterly (3 Month Cycles)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rollover Hours Initial Balance
                </label>
                <input
                  type="number"
                  value={retainerRolloverHours}
                  onChange={(e) => setRetainerRolloverHours(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Max Rollover Cap (Hours)
                </label>
                <input
                  type="number"
                  value={retainerRolloverCap}
                  onChange={(e) => setRetainerRolloverCap(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Standard Hourly Rate ($ USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="number"
                    value={retainerHourlyRate}
                    onChange={(e) => setRetainerHourlyRate(e.target.value)}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Overage Rate ($ USD / Hour)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="number"
                    value={retainerOverageRate}
                    onChange={(e) => setRetainerOverageRate(e.target.value)}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-xs text-purple-900 dark:text-purple-300 space-y-1">
              <span className="font-bold block">Retainer Pool Calculation:</span>
              <p>
                Monthly Base ({retainerHours}h) + Initial Rollover ({retainerRolloverHours}h) = <strong>{parseFloat(retainerHours || "0") + parseFloat(retainerRolloverHours || "0")} Total Available Hours</strong> this cycle.
                Any hours logged beyond this threshold will trigger overage alerts at ${retainerOverageRate}/hr.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-xs font-semibold transition"
              >
                <span>Continue to Team Allocation</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: TEAM ALLOCATION */}
        {step === 4 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                <span>Multi-User Team Allocation & Collaborators</span>
              </h2>
              <p className="text-xs text-slate-500">
                Select team members assigned to co-work on tasks across this project.
              </p>
            </div>

            <div className="space-y-2">
              {users.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);

                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedUserIds(selectedUserIds.filter((id) => id !== u.id));
                      } else {
                        setSelectedUserIds([...selectedUserIds, u.id]);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        {u.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{u.name}</h4>
                        <span className="text-[10px] text-slate-500">{u.email} • Role: {u.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {leadId === u.id && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          Designated Lead
                        </span>
                      )}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(5)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-xs font-semibold transition"
              >
                <span>Continue to Kickoff & Launch</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: PRE-LAUNCH CHECKLIST & FINAL LAUNCH */}
        {step === 5 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Pre-Launch Checklist & Onboarding Activation</span>
              </h2>
              <p className="text-xs text-slate-500">
                Confirm kickoff readiness before provisioning project delivery workflows and boards.
              </p>
            </div>

            {/* Project Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span className="text-sm">
                  [{key}] {name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {projectType === "GREENFIELD_MILESTONE" ? "Greenfield Milestone" : "Retainer Project"}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-[10px] text-slate-400 block">Client</span>
                  <strong>{clientName || "Direct / Internal"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Lead</span>
                  <strong>{users.find((u) => u.id === leadId)?.name || "Unassigned"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    {projectType === "GREENFIELD_MILESTONE" ? "Milestones" : "Retainer Base"}
                  </span>
                  <strong>
                    {projectType === "GREENFIELD_MILESTONE"
                      ? `${milestones.length} Phases (${budgetHours}h)`
                      : `${retainerHours} hrs/mo ($${retainerHourlyRate}/h)`}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Allocated Team</span>
                  <strong>{selectedUserIds.length} Members</strong>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Kickoff Readiness Checklist:
              </span>
              {checklist.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleToggleChecklist(idx)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition text-xs ${
                    item.completed
                      ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => {}}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className={item.completed ? "line-through opacity-80" : ""}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Seed Initial Tasks checkbox */}
            <div className="flex items-center gap-2 pt-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                id="create-initial-tasks"
                checked={createInitialTasks}
                onChange={(e) => setCreateInitialTasks(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="create-initial-tasks" className="font-semibold cursor-pointer">
                Automatically seed 2 kickoff tasks into the initial workflow queue
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 text-xs font-bold transition shadow-xs"
              >
                <Sparkles className="h-4 w-4" />
                <span>{submitting ? "Provisioning Project..." : "Complete Onboarding & Launch"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
