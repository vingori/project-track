"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useApp } from "@/context/AppContext";
import { UserRole } from "@/types";
import {
  Layers,
  Plus,
  Search,
  Shield,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  LogOut,
  LogIn,
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    currentProjectKey,
    setCurrentProjectKey,
    currentUserRole,
    setCurrentUserRole,
    setIsCreateModalOpen,
  } = useApp();

  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user?.role) {
      setCurrentUserRole(session.user.role as UserRole);
    }
  }, [session, setCurrentUserRole]);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: "ADMIN", label: "Admin", desc: "Full governance & system bypass" },
    { role: "PM", label: "Product Mgr", desc: "Sprint planning & scope" },
    { role: "LEAD", label: "Tech Lead", desc: "Reopen & lead approvals" },
    { role: "DEV", label: "Developer", desc: "Code transitions & estimates" },
    { role: "QA", label: "QA Lead", desc: "Required for 'Sign Off to Done'" },
    { role: "SUPPORT_AGENT", label: "Support Agent", desc: "SLA triage & resolution" },
  ];

  const currentProject = projects.find((p) => p.key === currentProjectKey);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: Brand & Project Selector */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-slate-900 dark:text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <Layers className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold">ZENITH</span>
            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              Governance Hub
            </span>
          </Link>

          {/* Project Switcher */}
          <div className="relative flex items-center">
            <select
              value={currentProjectKey}
              onChange={(e) => {
                const newKey = e.target.value;
                setCurrentProjectKey(newKey);
                router.push(`/projects/${newKey}/board`);
              }}
              className="h-8 appearance-none rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 pr-8 text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {projects.map((proj) => (
                <option key={proj.key} value={proj.key}>
                  [{proj.key}] {proj.name} ({proj.type === "SUPPORT_DESK" ? "Support" : "Scrum"})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* RAG Status Indicator */}
          {currentProject && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Project RAG:</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  currentProject.ragStatus === "GREEN"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                    : currentProject.ragStatus === "AMBER"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    currentProject.ragStatus === "GREEN"
                      ? "bg-emerald-500"
                      : currentProject.ragStatus === "AMBER"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                />
                {currentProject.ragStatus}
              </span>
            </div>
          )}
        </div>

        {/* Center / Right: Quick Actions, Role Switcher, Create */}
        <div className="flex items-center gap-3">
          {/* Quick Create Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create</span>
            <kbd className="hidden sm:inline-block rounded bg-indigo-700/60 px-1 text-[10px] font-mono text-indigo-100">
              C
            </kbd>
          </button>

          {/* Live RBAC Role Simulator */}
          <div className="flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 text-xs">
            <Shield className="h-3.5 w-3.5 text-indigo-500" />
            <span className="hidden lg:inline text-[11px] text-slate-600 dark:text-slate-400">
              Role Simulator:
            </span>
            <select
              value={currentUserRole}
              onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
              className="bg-transparent text-xs font-semibold text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.role} value={r.role} className="text-slate-900 dark:text-slate-100">
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* User Session & Authentication */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            {session?.user ? (
              <div className="flex items-center gap-2">
                <div
                  title={`${session.user.name} (${session.user.role})`}
                  className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-indigo-500/20"
                >
                  {session.user.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "U"}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[100px]">
                    {session.user.name}
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                    {session.user.role}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  title="Sign out of enterprise session"
                  className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
