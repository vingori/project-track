"use client";

import React from "react";
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
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { currentProjectKey } = useApp();

  const navItems = [
    {
      name: "Portfolio & Rollup",
      href: `/`,
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: "Kanban / Scrum Board",
      href: `/projects/${currentProjectKey}/board`,
      icon: KanbanSquare,
      badge: null,
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

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 min-h-[calc(100vh-3.5rem)] flex flex-col justify-between p-3">
      <div className="space-y-6">
        {/* Project Header Widget */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Active Project
            </span>
            <span className="font-mono text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
              {currentProjectKey}
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
            {currentProjectKey === "CORE"
              ? "Core Platform & NextGen"
              : "Customer Operations & SLA"}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
            <span>Type:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {currentProjectKey === "CORE" ? "Agile Scrum" : "Service Desk"}
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Views & Operations
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
                  <span className="rounded bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700 dark:text-indigo-300">
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
          State machine & RBAC transition rules active.
        </p>
      </div>
    </aside>
  );
}
