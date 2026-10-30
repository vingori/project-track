import { getAccountsWithMembers } from "@/lib/actions";
import { AccountsManager } from "@/components/AccountsManager";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const members = await getAccountsWithMembers();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Family Members & Accounts Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage family entities, broking firms (Zerodha, Groww, Upstox, ICICI Direct), and asset depositories
        </p>
      </div>

      <AccountsManager initialMembers={members} />
    </div>
  );
}
