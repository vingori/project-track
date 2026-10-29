import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import AuthProvider from "@/components/providers/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import CreateIssueModal from "@/components/modals/CreateIssueModal";
import IssueDetailModal from "@/components/modals/IssueDetailModal";

export const metadata: Metadata = {
  title: "Zenith | Enterprise Project Governance & Delivery Hub",
  description: "Enterprise project tracking, configurable workflows, RBAC, sprint boards, and SLA management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          <AppProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 flex flex-col min-w-0">
                  {children}
                </main>
              </div>
              {/* Global Modals */}
              <CreateIssueModal />
              <IssueDetailModal />
            </div>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
