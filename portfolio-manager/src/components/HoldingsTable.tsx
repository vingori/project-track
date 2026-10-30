"use client";

import { useState, useMemo } from "react";
import { formatINR, formatPercent, formatDate } from "@/lib/formatters";
import { updateHolding, deleteHolding } from "@/lib/actions";
import { CorporateActionModal } from "./CorporateActionModal";
import { SellHoldingModal } from "./SellHoldingModal";
import {
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Check,
  X,
  ExternalLink,
  Coins,
  TrendingUp,
  Building2,
  Landmark,
  Sparkles,
  ArrowDownRight,
} from "lucide-react";

interface HoldingItem {
  id: string;
  symbol: string;
  name: string;
  isin?: string | null;
  assetClass: string;
  subCategory?: string | null;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  lastPriceUpdate: Date | string;
  sector?: string | null;
  notes?: string | null;
  metadata?: string | null;
  currentValue: number;
  investedValue: number;
  unrealizedGain: number;
  gainPct: number;
  xirr: number | null;
  accountName: string;
  broker: string;
  familyMemberName: string;
  familyMemberColor?: string | null;
  transactionCount: number;
}

interface HoldingsTableProps {
  initialHoldings: HoldingItem[];
}

export function HoldingsTable({ initialHoldings }: HoldingsTableProps) {
  const [holdings, setHoldings] = useState<HoldingItem[]>(initialHoldings);
  const [search, setSearch] = useState("");
  const [assetFilter, setAssetFilter] = useState("ALL");
  const [brokerFilter, setBrokerFilter] = useState("ALL");
  const [sortField, setSortField] = useState<"currentValue" | "unrealizedGain" | "gainPct" | "symbol">("currentValue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Corporate Action Modal State
  const [selectedCorporateHolding, setSelectedCorporateHolding] = useState<HoldingItem | null>(null);

  // Sell Modal State
  const [selectedSellHolding, setSelectedSellHolding] = useState<HoldingItem | null>(null);

  // Extract unique brokers
  const brokers = useMemo(() => {
    const set = new Set(initialHoldings.map((h) => h.broker));
    return Array.from(set);
  }, [initialHoldings]);

  // Filtered & Sorted holdings
  const filteredHoldings = useMemo(() => {
    return holdings
      .filter((h) => {
        if (assetFilter !== "ALL" && h.assetClass !== assetFilter) return false;
        if (brokerFilter !== "ALL" && h.broker !== brokerFilter) return false;
        if (search.trim()) {
          const s = search.toLowerCase();
          const match =
            h.symbol.toLowerCase().includes(s) ||
            h.name.toLowerCase().includes(s) ||
            (h.sector && h.sector.toLowerCase().includes(s));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === "string") {
          return sortOrder === "asc"
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        return sortOrder === "asc"
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [holdings, assetFilter, brokerFilter, search, sortField, sortOrder]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const startEdit = (h: HoldingItem) => {
    setEditingId(h.id);
    setEditPrice(String(h.currentPrice));
    setEditQty(String(h.quantity));
    setEditNotes(h.notes || "");
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      await updateHolding(id, {
        currentPrice: Number(editPrice),
        quantity: Number(editQty),
        notes: editNotes,
      });

      setHoldings((prev) =>
        prev.map((h) => {
          if (h.id === id) {
            const newQty = Number(editQty);
            const newPrice = Number(editPrice);
            const curVal = newQty * newPrice;
            const invVal = newQty * h.avgBuyPrice;
            const gain = curVal - invVal;
            const gainPct = invVal > 0 ? (gain / invVal) * 100 : 0;
            return {
              ...h,
              quantity: newQty,
              currentPrice: newPrice,
              currentValue: curVal,
              investedValue: invVal,
              unrealizedGain: gain,
              gainPct,
              notes: editNotes,
            };
          }
          return h;
        })
      );
      setEditingId(null);
    } catch (err: any) {
      alert("Failed to update holding: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await deleteHolding(id);
      setHoldings((prev) => prev.filter((h) => h.id !== id));
    } catch (err: any) {
      alert("Failed to delete holding: " + err.message);
    }
  };

  // Asset class badge colors
  const getBadgeStyle = (ac: string) => {
    switch (ac) {
      case "EQUITY":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "MUTUAL_FUND":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "COMMODITY":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "REAL_ESTATE":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "FIXED_INCOME":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stock, MF, property, or sector..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Asset Class Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Class:</span>
            <select
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Classes</option>
              <option value="EQUITY">Stocks (Equity)</option>
              <option value="MUTUAL_FUND">Mutual Funds</option>
              <option value="COMMODITY">Gold & Commodities</option>
              <option value="REAL_ESTATE">Real Estate</option>
              <option value="FIXED_INCOME">Fixed Income & FDs</option>
            </select>
          </div>

          {/* Broker Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Broker:</span>
            <select
              value={brokerFilter}
              onChange={(e) => setBrokerFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Brokers</option>
              {brokers.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Showing <strong className="text-white">{filteredHoldings.length}</strong> of {holdings.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold">
                <th
                  onClick={() => handleSort("symbol")}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-200 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Asset / Symbol</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-3">Owner & Broker</th>
                <th className="py-3.5 px-3 text-right">Quantity</th>
                <th className="py-3.5 px-3 text-right">Avg Cost</th>
                <th className="py-3.5 px-3 text-right">LTP / Price</th>
                <th
                  onClick={() => handleSort("currentValue")}
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-slate-200 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Current Value</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("unrealizedGain")}
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-slate-200 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Unrealized P&L</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("gainPct")}
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-slate-200 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Returns & XIRR</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredHoldings.map((h) => {
                const isEditing = editingId === h.id;
                const isPositive = h.unrealizedGain >= 0;

                return (
                  <tr
                    key={h.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Symbol & Name */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-start gap-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200 font-mono text-sm">
                              {h.symbol}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getBadgeStyle(
                                h.assetClass
                              )}`}
                            >
                              {h.subCategory || h.assetClass}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {h.name}
                          </div>
                          {h.sector && (
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {h.sector}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Owner & Broker */}
                    <td className="py-3.5 px-3 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: h.familyMemberColor || "#10b981",
                          }}
                        />
                        <span className="font-semibold text-slate-300">
                          {h.familyMemberName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {h.broker}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          step="any"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          className="w-20 bg-slate-950 border border-emerald-500 rounded px-1.5 py-0.5 text-right text-xs text-white"
                        />
                      ) : (
                        <span className="text-slate-300 font-medium">
                          {h.quantity.toLocaleString("en-IN")}
                        </span>
                      )}
                    </td>

                    {/* Avg Buy Cost */}
                    <td className="py-3.5 px-3 text-right text-slate-400">
                      {formatINR(h.avgBuyPrice)}
                    </td>

                    {/* Current Price */}
                    <td className="py-3.5 px-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          step="any"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-24 bg-slate-950 border border-emerald-500 rounded px-1.5 py-0.5 text-right text-xs text-white"
                        />
                      ) : (
                        <span className="text-slate-200 font-bold">
                          {formatINR(h.currentPrice)}
                        </span>
                      )}
                    </td>

                    {/* Current Market Value */}
                    <td className="py-3.5 px-3 text-right font-bold text-slate-100 text-sm">
                      {formatINR(h.currentValue)}
                    </td>

                    {/* Unrealized Gain */}
                    <td className="py-3.5 px-3 text-right">
                      <div
                        className={`font-bold ${
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {formatINR(h.unrealizedGain)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Inv: {formatINR(h.investedValue, { compact: true })}
                      </div>
                    </td>

                    {/* Returns & XIRR */}
                    <td className="py-3.5 px-3 text-right">
                      <div
                        className={`inline-block px-2 py-0.5 rounded font-bold border text-xs ${
                          isPositive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {formatPercent(h.gainPct)}
                      </div>
                      {h.xirr !== null && (
                        <div className="text-[10px] text-blue-400 mt-0.5 font-semibold">
                          XIRR: {formatPercent(h.xirr)}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center font-sans">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => saveEdit(h.id)}
                            disabled={saving}
                            className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            title="Save changes"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedSellHolding(h)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Record Sale / Exit Position"
                          >
                            <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
                          </button>
                          {h.assetClass === "EQUITY" && (
                            <button
                              onClick={() => setSelectedCorporateHolding(h)}
                              className="p-1 text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 rounded transition-colors"
                              title="Apply Stock Split, Bonus Issue, or Dividend"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                            </button>
                          )}
                          <button
                            onClick={() => startEdit(h)}
                            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                            title="Update price or holding"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(h.id, h.name)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Delete position"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Corporate Action Modal */}
      <CorporateActionModal
        isOpen={Boolean(selectedCorporateHolding)}
        onClose={() => setSelectedCorporateHolding(null)}
        holding={selectedCorporateHolding}
      />

      {/* Sell / Exit Position Modal */}
      <SellHoldingModal
        isOpen={Boolean(selectedSellHolding)}
        onClose={() => setSelectedSellHolding(null)}
        holding={selectedSellHolding}
      />
    </div>
  );
}
