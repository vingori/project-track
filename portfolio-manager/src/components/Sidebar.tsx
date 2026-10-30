"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Coins,
  LineChart,
  Building2,
  Receipt,
  FileSpreadsheet,
  Users2,
  TrendingUp,
  Bell,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Holdings", href: "/holdings", icon: Coins },
  { name: "Insights & Rebalance", href: "/analytics", icon: LineChart },
  { name: "Real Estate & Assets", href: "/real-estate", icon: Building2 },
  { name: "Tax & Capital Gains", href: "/tax", icon: Receipt },
  { name: "Corporate Actions & Activity", href: "/notifications", icon: Bell },
  { name: "Import & Export", href: "/import-export", icon: FileSpreadsheet },
  { name: "Family & Accounts", href: "/accounts", icon: Users2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/70 backdrop-blur-md flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TrendingUp className="h-5 w-5 text-slate-950 font-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white">WealthPulse</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Family Office PMS</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 shadow-sm shadow-emerald-500/5"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                )}
              >
                <Icon
                  className={clsx(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-400"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span>Local Vault</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Encrypted
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Multi-broker statements stored in local SQLite database. 100% private.
          </p>
        </div>
      </div>
    </aside>
  );
}
