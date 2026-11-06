"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  LayoutDashboard,
  KanbanSquare,
  ListTodo,
  LifeBuoy,
  GitBranch,
  ShieldAlert,
  Users,
  Settings,
  Flame,
  CheckCircle,
  Activity,
  Clock,
  PlusCircle,
  Target,
  Repeat,
  Sparkles,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { currentProjectKey, refreshKey } = useApp();

  const [project, setProject] = useState<any | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${currentProjectKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.key) setProject(data);
      })
      .catch((err) => console.error(err));
  }, [currentProjectKey, refreshKey]);

  const navItems = [
    {
      name: "Portfolio Dashboard",
      href: `/`,
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: "Swimlane Board",
      href: `/projects/${currentProjectKey}/board`,
      icon: KanbanSquare,
      badge: "Swimlanes",
    },
    {
      name: "Project Health Checks",
      href: `/projects/${currentProjectKey}/health`,
      icon: Activity,
      badge: project?.ragStatus || null,
    },
    {
      name: "Timesheet & Time Logs",
      href: `/timesheet`,
      icon: Clock,
      badge: null,
    },
    {
      name: "New Project Onboarding",
      href: `/onboarding`,
      icon: PlusCircle,
      badge: "Wizard",
    },
    {
      name: "Backlog & Sprints",
      href: `/projects/${currentProjectKey}/backlog`,
      icon: ListTodo,
      badge: null,
    },
    {
      name: "Support & SLA Queues",
      href: `/projects/${currentProjectKey}/support`,
      icon: LifeBuoy,
      badge: currentProjectKey === "SUPP" ? "Active SLAs" : null,
    },
    {
      name: "Workflow & Governance",
      href: `/projects/${currentProjectKey}/governance`,
      icon: GitBranch,
      badge: "State Machine",
    },
  ];

  const getTypologyLabel = (type: string) => {
    switch (type) {
      case "GREENFIELD_MILESTONE":
        return "Greenfield Milestone";
      case "RETAINER":
        return "Retainer SRE/Ops";
      case "SUPPORT_DESK":
        return "Service Desk";
      default:
        return "Agile Scrum";
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 min-h-[calc(100vh-3.5rem)] flex flex-col justify-between p-3">
      <div className="space-y-6">
        {/* Project Header Widget */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Active Project
            </span>
            <div className="flex items-center gap-1.5">
              {project?.ragStatus && (
                <span
                  className={`h-2 w-2 rounded-full ${
                    project.ragStatus === "GREEN"
                      ? "bg-emerald-500"
                      : project.ragStatus === "AMBER"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  title={`Project RAG: ${project.ragStatus}`}
                />
              )}
              <span className="font-mono text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
                {currentProjectKey}
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {project?.name || (currentProjectKey === "CORE" ? "Core Platform" : "Current Project")}
            </p>
            {project?.clientName && (
              <p className="text-[10px] text-slate-500 truncate">
                Client: {project.clientName}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
            <span>Type:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {getTypologyLabel(project?.type || "")}
            </span>
          </div>

          {project?.type === "RETAINER" && (
            <div className="flex items-center justify-between text-[10px] text-purple-700 dark:text-purple-300 font-semibold bg-purple-50 dark:bg-purple-950/40 px-2 py-1 rounded">
              <span>Retainer Pool:</span>
              <span>{project.stats?.retainerUsedHours || 0} / {project.stats?.retainerAvailableHours || project.retainerHours || 0}h</span>
            </div>
          )}

          {project?.type === "GREENFIELD_MILESTONE" && (
            <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded">
              <span>Milestones:</span>
              <span>{project.milestones?.filter((m: any) => m.status === "REACHED").length || 0} / {project.milestones?.length || 0} Delivered</span>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Delivery & Governance
          </div>
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                      item.badge === "GREEN"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : item.badge === "AMBER"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : item.badge === "RED"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        : "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Governance & Compliance Footer Pill */}
      <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-2.5 text-center text-[11px] text-slate-600 dark:text-slate-400">
        <div className="flex items-center justify-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
          <ShieldAlert className="h-3.5 w-3.5 text-emerald-500" />
          <span>Governance Enforced</span>
        </div>
        <p className="mt-0.5 text-[10px]">
          Milestones, Retainers & RBAC rules active.
        </p>
      </div>
    </aside>
  );
}
