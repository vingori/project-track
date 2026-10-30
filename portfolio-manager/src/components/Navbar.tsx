"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Users, Plus, UploadCloud, Download, Sparkles, RefreshCw, Zap, Bell } from "lucide-react";
import { syncMarketPrices } from "@/lib/actions";

interface Member {
  id: string;
  name: string;
  relationship: string;
  avatarColor: string;
}

interface NavbarProps {
  members: Member[];
  onOpenAddModal: () => void;
}

export function Navbar({ members, onOpenAddModal }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentMember = searchParams.get("member") || "ALL";
  const [syncing, setSyncing] = useState(false);

  const handleSyncPrices = async () => {
    setSyncing(true);
    try {
      const res = await syncMarketPrices();
      alert(
        `Market sync complete! Scanned ${res.totalScanned} assets. Updated live prices for ${res.updatedCount} instruments.`
      );
    } catch (err: any) {
      alert("Error syncing market prices: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleMemberChange = (memberId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (memberId === "ALL") {
      params.delete("member");
    } else {
      params.set("member", memberId);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Family Member Filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <Users className="h-4 w-4 text-emerald-400" />
          <span>Entity:</span>
        </div>

        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-1 gap-1">
          <button
            onClick={() => handleMemberChange("ALL")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              currentMember === "ALL"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            All Family (Consolidated)
          </button>

          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => handleMemberChange(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                currentMember === m.id
                  ? "bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: m.avatarColor }}
              />
              <span>{m.name.split(" ")[0]}</span>
              <span className="text-[10px] text-slate-500 font-mono">
                ({m.relationship})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={handleSyncPrices}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all shadow-sm disabled:opacity-50"
          title="Fetch latest NSE/BSE live stock quotes and AMFI mutual fund NAVs"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-amber-400 ${
              syncing ? "animate-spin" : ""
            }`}
          />
          <span>{syncing ? "Syncing..." : "Sync Live Prices"}</span>
        </button>

        <button
          onClick={() => router.push("/notifications")}
          className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all shadow-sm"
          title="Corporate Actions, Dividends & Activity Timeline"
        >
          <Bell className="h-3.5 w-3.5 text-blue-400" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>

        <button
          onClick={() => router.push("/import-export")}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
        >
          <UploadCloud className="h-3.5 w-3.5 text-emerald-400" />
          <span>Import Broker CSV</span>
        </button>

        <button
          onClick={() => router.push("/import-export#export")}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
        >
          <Download className="h-3.5 w-3.5 text-blue-400" />
          <span>Export Reports</span>
        </button>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-sm shadow-emerald-500/20"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Add Asset</span>
        </button>
      </div>
    </header>
  );
}
