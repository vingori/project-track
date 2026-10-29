"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layers, ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    { name: "Alex Vance", email: "alex.vance@acme.com", role: "ADMIN", color: "border-purple-300 dark:border-purple-800" },
    { name: "Sarah Jenkins", email: "sarah.j@acme.com", role: "PM", color: "border-blue-300 dark:border-blue-800" },
    { name: "David Kumar", email: "david.k@acme.com", role: "LEAD", color: "border-indigo-300 dark:border-indigo-800" },
    { name: "Elena Rostova", email: "elena.r@acme.com", role: "DEV", color: "border-emerald-300 dark:border-emerald-800" },
    { name: "Marcus Brody", email: "marcus.b@acme.com", role: "QA", color: "border-rose-300 dark:border-rose-800" },
    { name: "Priya Patel", email: "priya.p@acme.com", role: "SUPPORT_AGENT", color: "border-amber-300 dark:border-amber-800" },
  ];

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: loginEmail,
        password: loginPass,
        callbackUrl,
      });

      if (res?.error) {
        setError("Invalid corporate credentials. Default password is 'password123'.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    handleLogin(undefined, demoEmail, "password123");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-900 to-slate-950 pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Layers className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            ZENITH
          </h1>
          <p className="text-xs text-slate-400">
            Enterprise Project Governance & Delivery Hub
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-8 shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-semibold text-white">
              Corporate Single Sign-On
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your enterprise credentials or pick a verified team persona.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-950/60 border border-rose-800 p-3 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="alex.vance@acme.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <span className="text-[10px] text-slate-500">
                  Demo pass: <strong className="text-indigo-400">password123</strong>
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <span>Authenticating with JWT...</span>
              ) : (
                <>
                  <span>Sign In with Credentials</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Persona 1-Click Login Section */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-3 text-[11px] font-semibold text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Or 1-Click Sign-In as Persona:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickDemo(acc.email)}
                  className={`flex flex-col text-left p-2 rounded-lg border bg-slate-800/60 hover:bg-slate-800 transition ${acc.color}`}
                >
                  <span className="text-xs font-semibold text-white truncate">
                    {acc.name}
                  </span>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                    <span className="text-indigo-400 font-mono font-bold">
                      {acc.role}
                    </span>
                    <span>Click to login</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Tag */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Encrypted HTTP-Only Sessions • $0 API Costs • Self-Hosted</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-xs text-slate-400">
          Loading authentication gateway...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
