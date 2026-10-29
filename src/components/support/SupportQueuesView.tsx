"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { formatTimeRemaining } from "@/lib/utils";
import {
  LifeBuoy,
  Clock,
  AlertTriangle,
  CheckCircle,
  Inbox,
  UserCheck,
  Flame,
  Search,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function SupportQueuesView() {
  const { currentProjectKey, setSelectedIssueId, refreshKey, triggerRefresh } = useApp();

  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeQueue, setActiveQueue] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/issues?projectKey=${currentProjectKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setIssues(data);
      })
      .finally(() => setLoading(false));
  }, [currentProjectKey, refreshKey]);

  // SLA breach filter
  const breachedTickets = issues.filter((i) => i.slaBreached);
  const urgentTickets = issues.filter(
    (i) => i.priority === "CRITICAL" || i.priority === "HIGH"
  );
  const unassignedTickets = issues.filter((i) => !i.assigneeId);
  const waitingCustomerTickets = issues.filter(
    (i) => i.status.name.toLowerCase().includes("customer")
  );

  const getFilteredIssues = () => {
    let list = issues;
    if (activeQueue === "BREACHED") list = breachedTickets;
    else if (activeQueue === "URGENT") list = urgentTickets;
    else if (activeQueue === "UNASSIGNED") list = unassignedTickets;
    else if (activeQueue === "WAITING") list = waitingCustomerTickets;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.key.toLowerCase().includes(q) ||
          (i.customerEmail && i.customerEmail.toLowerCase().includes(q))
      );
    }
    return list;
  };

  const filtered = getFilteredIssues();

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Top Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Service Desk & SLA Triage Queues
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Real-time SLA resolution countdowns, escalation routing, and customer support triage.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-3 py-1 font-semibold text-rose-700 dark:text-rose-300">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
              {breachedTickets.length} Breached
            </span>
            <span className="flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 px-3 py-1 font-semibold text-amber-700 dark:text-amber-300">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              {unassignedTickets.length} Needs Triage
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Queue Selector Sidebar */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Triage Queues
          </div>
          {[
            { id: "ALL", name: "All Open Tickets", count: issues.length, icon: Inbox },
            { id: "BREACHED", name: "SLA Breached", count: breachedTickets.length, icon: AlertTriangle, danger: true },
            { id: "URGENT", name: "Critical & High Priority", count: urgentTickets.length, icon: Flame },
            { id: "UNASSIGNED", name: "Unassigned Triage", count: unassignedTickets.length, icon: UserCheck },
            { id: "WAITING", name: "Waiting on Customer", count: waitingCustomerTickets.length, icon: Mail },
          ].map((q) => {
            const Icon = q.icon;
            const isActive = activeQueue === q.id;
            return (
              <button
                key={q.id}
                onClick={() => setActiveQueue(q.id)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={`h-4 w-4 ${
                      q.danger ? "text-rose-500" : "text-slate-400"
                    }`}
                  />
                  <span>{q.name}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    q.danger && q.count > 0
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {q.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Ticket List */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950">
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket title, key, or customer email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Ticket Table */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Loading service desk queue...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No tickets matching this queue filter.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-4">Key</th>
                    <th className="py-2.5 px-4">Summary</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Priority</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">SLA Resolution</th>
                    <th className="py-2.5 px-4">Assignee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filtered.map((ticket) => {
                    const sla = ticket.slaResolveTarget
                      ? formatTimeRemaining(ticket.slaResolveTarget)
                      : null;

                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => setSelectedIssueId(ticket.id)}
                        className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 transition cursor-pointer"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {ticket.key}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-100 max-w-sm truncate">
                          {ticket.title}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {ticket.customerEmail || "Internal"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              ticket.priority === "CRITICAL"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                : ticket.priority === "HIGH"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                            style={{ backgroundColor: ticket.status.color }}
                          >
                            {ticket.status.name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {sla ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                                sla.isBreached
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                  : sla.isWarning
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              }`}
                            >
                              <Clock className="h-3 w-3" />
                              {sla.text}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                          {ticket.assignee?.name || (
                            <span className="text-amber-600 dark:text-amber-400 italic">
                              Unassigned
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
