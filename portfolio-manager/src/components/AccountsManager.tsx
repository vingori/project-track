"use client";

import { useState } from "react";
import { formatINR } from "@/lib/formatters";
import { createFamilyMember, createAccount } from "@/lib/actions";
import {
  Users2,
  Plus,
  Landmark,
  Coins,
  Building2,
  CheckCircle2,
  X,
  CreditCard,
} from "lucide-react";

interface MemberWithAccounts {
  id: string;
  name: string;
  relationship: string;
  pan?: string | null;
  avatarColor?: string | null;
  targetEquityPct?: number | null;
  targetDebtPct?: number | null;
  targetGoldPct?: number | null;
  targetRealEstatePct?: number | null;
  accounts: Array<{
    id: string;
    name: string;
    broker: string;
    accountType: string;
    accountNumber?: string | null;
    holdings: Array<{
      quantity: number;
      currentPrice: number;
    }>;
  }>;
}

interface AccountsManagerProps {
  initialMembers: MemberWithAccounts[];
}

export function AccountsManager({ initialMembers }: AccountsManagerProps) {
  const [members, setMembers] = useState(initialMembers);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedMemberForAccount, setSelectedMemberForAccount] = useState(
    initialMembers[0]?.id || ""
  );

  // New Member form
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Spouse");
  const [pan, setPan] = useState("");
  const [avatarColor, setAvatarColor] = useState("#3b82f6");

  // New Account form
  const [accountName, setAccountName] = useState("");
  const [broker, setBroker] = useState("Zerodha");
  const [accountType, setAccountType] = useState("DEMAT");
  const [accountNumber, setAccountNumber] = useState("");

  const [loading, setLoading] = useState(false);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    try {
      const created = await createFamilyMember({
        name,
        relationship,
        pan: pan || undefined,
        avatarColor,
      });
      setMembers((prev) => [...prev, { ...created, accounts: [] }]);
      setName("");
      setPan("");
      setIsMemberModalOpen(false);
    } catch (err: any) {
      alert("Error adding family member: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !selectedMemberForAccount) return;
    setLoading(true);
    try {
      const created = await createAccount({
        familyMemberId: selectedMemberForAccount,
        name: accountName,
        broker,
        accountType,
        accountNumber: accountNumber || undefined,
      });

      setMembers((prev) =>
        prev.map((m) =>
          m.id === selectedMemberForAccount
            ? {
                ...m,
                accounts: [...m.accounts, { ...created, holdings: [] }],
              }
            : m
        )
      );

      setAccountName("");
      setAccountNumber("");
      setIsAccountModalOpen(false);
    } catch (err: any) {
      alert("Error creating account: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Family Portfolios & Linked Accounts</h2>
          <p className="text-xs text-slate-400">
            Configure member identities, broking accounts, physical vaults, and property deeds
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 text-blue-400 stroke-[2.5]" />
            <span>Add Account / Folio</span>
          </button>

          <button
            onClick={() => setIsMemberModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Add Family Member</span>
          </button>
        </div>
      </div>

      {/* Family Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {members.map((member) => {
          const totalVal = member.accounts.reduce((accTotal, acc) => {
            const hVal = acc.holdings.reduce(
              (sum, h) => sum + h.quantity * h.currentPrice,
              0
            );
            return accTotal + hVal;
          }, 0);

          return (
            <div
              key={member.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl"
            >
              {/* Member Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg"
                    style={{ backgroundColor: member.avatarColor || "#10b981" }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {member.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                        {member.relationship}
                      </span>
                    </div>
                    {member.pan && (
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        PAN: {member.pan}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-lg font-bold text-emerald-400">
                    {formatINR(totalVal)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {member.accounts.length} linked accounts
                  </div>
                </div>
              </div>

              {/* Linked Accounts List */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-2">
                  Linked Broking & Asset Accounts:
                </span>

                {member.accounts.length > 0 ? (
                  member.accounts.map((acc) => {
                    const accVal = acc.holdings.reduce(
                      (sum, h) => sum + h.quantity * h.currentPrice,
                      0
                    );

                    return (
                      <div
                        key={acc.id}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-200">
                            {acc.name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                            <span className="text-emerald-400 font-sans font-medium">
                              {acc.broker}
                            </span>
                            <span>•</span>
                            <span className="text-slate-500">{acc.accountType}</span>
                            {acc.accountNumber && (
                              <>
                                <span>•</span>
                                <span className="text-slate-500">
                                  {acc.accountNumber}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="text-slate-200 font-bold">
                            {formatINR(accVal, { compact: true })}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {acc.holdings.length} holdings
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950/30 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    No accounts linked yet. Click &quot;Add Account / Folio&quot; to connect a broker.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Add Family Member / Entity</h3>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Full Name / Entity Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma, Sharma Family HUF"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Relationship *
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="Self">Self</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Child">Child</option>
                    <option value="HUF">HUF / Family Trust</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    PAN Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono uppercase focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Avatar Theme Color
                </label>
                <div className="flex items-center gap-2">
                  {["#3b82f6", "#10b981", "#ec4899", "#8b5cf6", "#f59e0b", "#06b6d4"].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setAvatarColor(color)}
                        className={`h-6 w-6 rounded-full border-2 transition-all ${
                          avatarColor === color
                            ? "border-white scale-110"
                            : "border-transparent opacity-70"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold"
                >
                  {loading ? "Adding..." : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Add Account / Folio</h3>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Family Member Owner *
                </label>
                <select
                  value={selectedMemberForAccount}
                  onChange={(e) => setSelectedMemberForAccount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.relationship})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Account Display Name *
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Zerodha Kite Demat, Groww Direct MF"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Broker / Institution *
                  </label>
                  <select
                    value={broker}
                    onChange={(e) => setBroker(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="Zerodha">Zerodha</option>
                    <option value="ICICI Direct">ICICI Direct</option>
                    <option value="Nirmal Bang">Nirmal Bang</option>
                    <option value="Groww">Groww</option>
                    <option value="Direct AMC / CAMS">Direct AMC / CAMS Folio</option>
                    <option value="Upstox">Upstox</option>
                    <option value="HDFC Sky / Bank">HDFC Sky / Bank</option>
                    <option value="Physical/Registry">Physical Vault / Registry</option>
                    <option value="Other">Other Broker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Account Type *
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="DEMAT">Demat / Trading</option>
                    <option value="MUTUAL_FUND">Mutual Fund Folio</option>
                    <option value="SAVINGS_FD">Savings / FD</option>
                    <option value="COMMODITY_VAULT">Gold Vault / Locker</option>
                    <option value="REAL_ESTATE">Property Deed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Account / Demat / Folio Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. ZR992182, 10294829/01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold"
                >
                  {loading ? "Creating..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
