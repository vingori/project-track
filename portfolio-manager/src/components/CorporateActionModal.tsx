"use client";

import { useState } from "react";
import { X, Sparkles, Split, Gift, DollarSign, Calendar } from "lucide-react";
import { applyCorporateAction } from "@/lib/actions";
import { formatINR } from "@/lib/formatters";

interface CorporateActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  holding: {
    id: string;
    symbol: string;
    name: string;
    quantity: number;
    avgBuyPrice: number;
    currentPrice: number;
  } | null;
}

export function CorporateActionModal({
  isOpen,
  onClose,
  holding,
}: CorporateActionModalProps) {
  const [actionType, setActionType] = useState<"SPLIT" | "BONUS" | "DIVIDEND">("SPLIT");
  const [num, setNum] = useState("2"); // e.g. 2 for 1:2 split or 1 for 1:1 bonus
  const [den, setDen] = useState("1");
  const [dividendPerShare, setDividendPerShare] = useState("");
  const [recordDate, setRecordDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !holding) return null;

  const currentInvested = holding.quantity * holding.avgBuyPrice;

  // Split preview
  const splitMultiplier = (Number(num) || 1) / (Number(den) || 1);
  const previewSplitQty = holding.quantity * splitMultiplier;
  const previewSplitAvg = holding.avgBuyPrice / splitMultiplier;

  // Bonus preview
  const bonusMultiplier = (Number(num) || 1) / (Number(den) || 1);
  const previewBonusQty = holding.quantity + holding.quantity * bonusMultiplier;
  const previewBonusAvg = currentInvested / (previewBonusQty || 1);

  // Dividend preview
  const totalDividendPayout = holding.quantity * (Number(dividendPerShare) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await applyCorporateAction({
        holdingId: holding.id,
        actionType,
        ratioNumerator: Number(num),
        ratioDenominator: Number(den),
        dividendPerShare: Number(dividendPerShare) || undefined,
        recordDate,
        notes,
      });

      alert(
        `Corporate action applied successfully for ${holding.symbol}!`
      );
      onClose();
    } catch (err: any) {
      alert("Error applying corporate action: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Apply Corporate Action</h2>
              <p className="text-xs text-slate-400">
                {holding.symbol} — {holding.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Action Type Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Select Corporate Action Event *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActionType("SPLIT")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border font-bold transition-all ${
                  actionType === "SPLIT"
                    ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Split className="h-3.5 w-3.5" />
                <span>Stock Split</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType("BONUS")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border font-bold transition-all ${
                  actionType === "BONUS"
                    ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Gift className="h-3.5 w-3.5" />
                <span>Bonus Issue</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType("DIVIDEND")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border font-bold transition-all ${
                  actionType === "DIVIDEND"
                    ? "bg-blue-500/15 border-blue-500/50 text-blue-300 shadow-sm"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                <span>Dividend</span>
              </button>
            </div>
          </div>

          {/* SPLIT / BONUS RATIO INPUT */}
          {actionType !== "DIVIDEND" && (
            <div className="space-y-3">
              <label className="block text-slate-300 font-semibold">
                {actionType === "SPLIT" ? "Stock Split Ratio" : "Bonus Issue Ratio"}
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <span className="text-[10px] text-slate-400 block mb-1">
                    {actionType === "SPLIT" ? "New Shares" : "Bonus Received"}
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={num}
                    onChange={(e) => setNum(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-center text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <span className="text-xl font-bold text-slate-500 pt-4">:</span>
                <div className="flex-1">
                  <span className="text-[10px] text-slate-400 block mb-1">
                    Existing Shares Held
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={den}
                    onChange={(e) => setDen(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-center text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Impact Preview Box */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block">
                  Projected Portfolio Impact:
                </span>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans">
                      Holding Quantity:
                    </span>
                    <span className="text-slate-400 line-through mr-2">
                      {holding.quantity}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      →{" "}
                      {actionType === "SPLIT"
                        ? previewSplitQty
                        : previewBonusQty}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans">
                      New Average Buy Cost:
                    </span>
                    <span className="text-slate-400 line-through mr-2">
                      {formatINR(holding.avgBuyPrice)}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      →{" "}
                      {formatINR(
                        actionType === "SPLIT"
                          ? previewSplitAvg
                          : previewBonusAvg
                      )}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 font-sans">
                  Total invested capital remains preserved at{" "}
                  <strong className="text-slate-200">
                    {formatINR(currentInvested)}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* DIVIDEND CASH PAYOUT INPUT */}
          {actionType === "DIVIDEND" && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Dividend Payout per Share (₹) *
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={dividendPerShare}
                  onChange={(e) => setDividendPerShare(e.target.value)}
                  placeholder="e.g. 28.50"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between">
                <span>Total Cash Credit to Bank:</span>
                <span className="font-bold font-mono text-sm">
                  {formatINR(totalDividendPayout)}
                </span>
              </div>
            </div>
          )}

          {/* Record Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Record / Effective Date
              </label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Notes / Reference
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. AGM Board Approval"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? "Applying..." : "Apply Corporate Action"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
