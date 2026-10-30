import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "WealthPulse - Multi-Account Family Portfolio Management",
  description: "Comprehensive portfolio manager for multi-broker Indian family wealth, stocks, mutual funds, gold, and real estate.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const familyMembers = await prisma.familyMember.findMany({
    orderBy: { createdAt: "asc" },
  });

  const accounts = await prisma.account.findMany({
    include: {
      familyMember: true,
    },
    orderBy: { name: "asc" },
  });

  const memberList = familyMembers.map((m) => ({
    id: m.id,
    name: m.name,
    relationship: m.relationship,
    avatarColor: m.avatarColor || "#10b981",
  }));

  const accountList = accounts.map((acc) => ({
    id: acc.id,
    name: acc.name,
    broker: acc.broker,
    familyMemberName: acc.familyMember.name,
  }));

  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <AppShell members={memberList} accounts={accountList}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
