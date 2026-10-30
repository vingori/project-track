"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { AddAssetModal } from "./AddAssetModal";

interface Member {
  id: string;
  name: string;
  relationship: string;
  avatarColor: string;
}

interface AccountOption {
  id: string;
  name: string;
  broker: string;
  familyMemberName: string;
}

interface AppShellProps {
  children: React.ReactNode;
  members: Member[];
  accounts: AccountOption[];
}

export function AppShell({ children, members, accounts }: AppShellProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          members={members}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>

      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        accounts={accounts}
      />
    </div>
  );
}
