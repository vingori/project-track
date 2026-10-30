"use client";

import { useState } from "react";
import { X, Plus, Sparkles, Building2, Coins, TrendingUp, Landmark } from "lucide-react";
import { addHolding } from "@/lib/actions";

interface AccountOption {
  id: string;
  name: string;
  broker: string;
  familyMemberName: string;
}

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountOption[];
}

export function AddAssetModal({ isOpen, onClose, accounts }: AddAssetModalProps) {
  const [loading, setLoading] = useState(false);
  const [assetClass, setAssetClass] = useState<string>("EQUITY");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [isin, setIsin] = useState("");
  const [subCategory, setSubCategory] = useState("Large Cap");
  const [quantity, setQuantity] = useState("1");
  const [avgBuyPrice, setAvgBuyPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [sector, setSector] = useState("");
  const [notes, setNotes] = useState("");
  const [initialBuyDate, setInitialBuyDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Real estate / FD extra fields
  const [monthlyRental, setMonthlyRental] = useState("");
  const [carpetAreaSqFt, setCarpetAreaSqFt] = useState("");
  const [fdInterestRate, setFdInterestRate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !symbol || !name || !avgBuyPrice) {
      alert("Please fill in the required fields (Account, Symbol, Name, Cost Basis)");
      return;
    }

    setLoading(true);
    try {
      let metadata: string | undefined = undefined;
      if (assetClass === "REAL_ESTATE") {
        metadata = JSON.stringify({
          monthlyRental: Number(monthlyRental) || 0,
          carpetAreaSqFt: Number(carpetAreaSqFt) || 0,
        });
      } else if (assetClass === "FIXED_INCOME" || assetClass === "COMMODITY") {
        metadata = JSON.stringify({
          interestRate: Number(fdInterestRate) || 0,
          maturityDate: maturityDate || undefined,
        });
      }

      await addHolding({
        accountId,
        symbol,
        name,
        isin: isin || undefined,
        assetClass,
        subCategory,
        quantity: Number(quantity),
        avgBuyPrice: Number(avgBuyPrice),
        currentPrice: Number(currentPrice || avgBuyPrice),
        sector: sector || undefined,
        notes: notes || undefined,
        metadata,
        initialBuyDate,
      });

      onClose();
    } catch (err: any) {
      alert("Error adding asset: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Plus className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Add Investment / Asset</h2>
              <p className="text-xs text-slate-400">Manual entry across any family portfolio account</p>
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm">
          {/* Target Account */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Target Account & Family Member *
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm"
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.familyMemberName} — {acc.name} ({acc.broker})
                </option>
              ))}
            </select>
          </div>

          {/* Asset Class Selector Pills */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Asset Class *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "EQUITY", label: "Stock / Equity", icon: TrendingUp },
                { id: "MUTUAL_FUND", label: "Mutual Fund", icon: Coins },
                { id: "COMMODITY", label: "Gold / Silver / SGB", icon: Coins },
                { id: "REAL_ESTATE", label: "Real Estate", icon: Building2 },
                { id: "FIXED_INCOME", label: "Fixed Deposit / Debt", icon: Landmark },
                { id: "CASH", label: "Cash & Savings", icon: Coins },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = assetClass === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setAssetClass(item.id);
                      if (item.id === "EQUITY") setSubCategory("Large Cap");
                      else if (item.id === "MUTUAL_FUND") setSubCategory("Flexi Cap");
                      else if (item.id === "COMMODITY") setSubCategory("Gold SGB");
                      else if (item.id === "REAL_ESTATE") setSubCategory("Residential Property");
                      else if (item.id === "FIXED_INCOME") setSubCategory("Fixed Deposit");
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-semibold"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Symbol & Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Symbol / Ticker / Identifier *
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. INFY, PPFAS_FLEXI, SGBNOV29"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Infosys Ltd, 3BHK Whitefield"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm"
                required
              />
            </div>
          </div>

          {/* Quantity & Buy Price */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Quantity / Units / Grams *
              </label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Average Buy Price (₹) *
              </label>
              <input
                type="number"
                step="any"
                value={avgBuyPrice}
                onChange={(e) => setAvgBuyPrice(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Current Market Price (₹)
              </label>
              <input
                type="number"
                step="any"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                placeholder="Defaults to buy price"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          {/* Subcategory & Sector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Sub Category
              </label>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="e.g. Large Cap, Gold SGB, Residential"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Sector / Industry / Location
              </label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="e.g. Technology, Banking, Whitefield"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          {/* Real estate extra attributes */}
          {assetClass === "REAL_ESTATE" && (
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1">
                  Monthly Rental Cashflow (₹)
                </label>
                <input
                  type="number"
                  value={monthlyRental}
                  onChange={(e) => setMonthlyRental(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-300 mb-1">
                  Carpet Area (Sq Ft)
                </label>
                <input
                  type="number"
                  value={carpetAreaSqFt}
                  onChange={(e) => setCarpetAreaSqFt(e.target.value)}
                  placeholder="e.g. 1850"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* FD / SGB extra attributes */}
          {(assetClass === "FIXED_INCOME" || assetClass === "COMMODITY") && (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-amber-300 mb-1">
                  Annual Interest / Coupon Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={fdInterestRate}
                  onChange={(e) => setFdInterestRate(e.target.value)}
                  placeholder="e.g. 7.5"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-300 mb-1">
                  Maturity Date
                </label>
                <input
                  type="date"
                  value={maturityDate}
                  onChange={(e) => setMaturityDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Initial Purchase Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Purchase / Acquisition Date
              </label>
              <input
                type="date"
                value={initialBuyDate}
                onChange={(e) => setInitialBuyDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Notes / Folio / Demat Details
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes or folio number"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-semibold shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Save Investment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
