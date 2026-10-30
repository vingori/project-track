"use client";

import { useState } from "react";
import { X, ArrowDownRight, CheckCircle2, AlertCircle, Percent } from "lucide-react";
import { sellHolding } from "@/lib/actions";
import { formatINR } from "@/lib/formatters";

interface SellHoldingModalProps {
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

export function SellHoldingModal({ isOpen, onClose, holding }: SellHoldingModalProps) {
  const [qtyToSell, setQtyToSell] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellDate, setSellDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !holding) return null;

  const currentPrice = holding.currentPrice || holding.avgBuyPrice;
  const numQty = Number(qtyToSell) || 0;
  const numPrice = Number(sellPrice || currentPrice) || 0;

  // Realized Gain preview calculation
  const totalSaleValue = numQty * numPrice;
  const costBasis = numQty * holding.avgBuyPrice;
  const projectedGain = totalSaleValue - costBasis;
  const projectedGainPct = costBasis > 0 ? (projectedGain / costBasis) * 100 : 0;
  const isGain = projectedGain >= 0;

  // Guardrail validation check
  const isOverQuantity = numQty > holding.quantity;
  const isInvalidQty = numQty <= 0;

  const handleSellMax = () => {
    setQtyToSell(String(holding.quantity));
  };

  const handleSellHalf = () => {
    setQtyToSell(String(Math.floor(holding.quantity / 2) || 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverQuantity || isInvalidQty) return;

    setLoading(true);
    try {
      const res = await sellHolding({
        holdingId: holding.id,
        quantityToSell: numQty,
        sellPrice: numPrice,
        sellDate,
        notes: notes || undefined,
      });

      alert(
        `Sale recorded successfully! Realized P&L: ${
          res.realizedGain >= 0 ? "+" : ""
        }₹${res.realizedGain.toFixed(2)}. Remaining shares: ${res.remainingQty}`
      );
      onClose();
    } catch (err: any) {
      alert("Error executing sale: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <ArrowDownRight className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Record Sale / Exit</h2>
              <p className="text-xs text-slate-400 font-mono">
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Holding balance pill */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-medium">
                Shares Available in Demat:
              </span>
              <span className="text-sm font-bold text-slate-200 font-mono">
                {holding.quantity} units
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block font-medium">
                Avg Cost Basis:
              </span>
              <span className="text-sm font-bold text-slate-400 font-mono">
                {formatINR(holding.avgBuyPrice)}
              </span>
            </div>
          </div>

          {/* Quantity to Sell */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold">
                Quantity to Sell *
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSellHalf}
                  className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={handleSellMax}
                  className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-amber-300 font-bold hover:bg-slate-700"
                >
                  Sell All (100%)
                </button>
              </div>
            </div>
            <input
              type="number"
              step="any"
              max={holding.quantity}
              value={qtyToSell}
              onChange={(e) => setQtyToSell(e.target.value)}
              placeholder={`Max: ${holding.quantity}`}
              className={`w-full bg-slate-950 border rounded-lg p-2.5 text-slate-200 font-mono text-sm focus:outline-none ${
                isOverQuantity
                  ? "border-rose-500 text-rose-300"
                  : "border-slate-800 focus:border-rose-500"
              }`}
              required
            />
            {isOverQuantity && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Guardrail Alert: You only own {holding.quantity} shares.
              </p>
            )}
          </div>

          {/* Sale Price */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Sale Price per Share (₹) *
            </label>
            <input
              type="number"
              step="any"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder={`LTP: ${holding.currentPrice || holding.avgBuyPrice}`}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono text-sm focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          {/* Sale Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Execution / Trade Date
              </label>
              <input
                type="date"
                value={sellDate}
                onChange={(e) => setSellDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Trade Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Profit booking"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Realized P&L Preview Box */}
          {numQty > 0 && numPrice > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-sans">Total Sale Value:</span>
                <span className="text-slate-200 font-bold">
                  {formatINR(totalSaleValue)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-slate-400 font-sans">Realized Capital Gain:</span>
                <span
                  className={`font-bold ${
                    isGain ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isGain ? "+" : ""}
                  {formatINR(projectedGain)} ({projectedGainPct.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
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
              disabled={loading || isOverQuantity || isInvalidQty}
              className="px-5 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold transition-all shadow-md shadow-rose-500/20 disabled:opacity-50"
            >
              {loading ? "Recording..." : "Confirm & Record Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
