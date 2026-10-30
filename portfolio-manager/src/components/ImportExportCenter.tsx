"use client";

import { useState } from "react";
import { importStatementData } from "@/lib/actions";
import { formatINR, formatDate } from "@/lib/formatters";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";

interface AccountOption {
  id: string;
  name: string;
  broker: string;
  familyMemberName: string;
}

interface ImportLogItem {
  id: string;
  fileName: string;
  broker: string;
  status: string;
  recordCount: number;
  errorMessage?: string | null;
  createdAt: Date | string;
}

interface HoldingExportItem {
  symbol: string;
  name: string;
  isin?: string | null;
  assetClass: string;
  subCategory?: string | null;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedGain: number;
  gainPct: number;
  broker: string;
  familyMemberName: string;
}

interface ImportExportCenterProps {
  accounts: AccountOption[];
  recentLogs: ImportLogItem[];
  allHoldings: HoldingExportItem[];
}

export function ImportExportCenter({
  accounts,
  recentLogs,
  allHoldings,
}: ImportExportCenterProps) {
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || "");
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      setUploadStatus(null);
    };
    reader.readAsText(file);
  };

  const handleProcessImport = async () => {
    if (!selectedAccount || !fileContent) {
      alert("Please select a target account and provide a CSV file.");
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      const res = await importStatementData({
        accountId: selectedAccount,
        csvContent: fileContent,
        fileName: fileName || "statement.csv",
      });

      if (res.success) {
        setUploadStatus({
          success: true,
          message: `Successfully imported ${res.count} positions into account! Detected Broker: ${res.detectedBroker}`,
        });
        setFileContent("");
        setFileName("");
      } else {
        setUploadStatus({
          success: false,
          message: `Import failed: ${res.message}`,
        });
      }
    } catch (err: any) {
      setUploadStatus({
        success: false,
        message: err.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const loadSample = async (samplePath: string, name: string) => {
    try {
      const res = await fetch(samplePath);
      const text = await res.text();
      setFileContent(text);
      setFileName(name);
      setUploadStatus(null);
    } catch (err: any) {
      alert("Failed to load sample: " + err.message);
    }
  };

  // Export functions
  const downloadPortfolioCSV = () => {
    const headers = [
      "Family Member",
      "Broker",
      "Symbol",
      "Name",
      "ISIN",
      "Asset Class",
      "Sub Category",
      "Quantity",
      "Avg Buy Price (INR)",
      "Current Price (INR)",
      "Current Market Value (INR)",
      "Unrealized PnL (INR)",
      "Return %",
    ];

    const rows = allHoldings.map((h) => [
      `"${h.familyMemberName}"`,
      `"${h.broker}"`,
      `"${h.symbol}"`,
      `"${h.name}"`,
      `"${h.isin || ""}"`,
      `"${h.assetClass}"`,
      `"${h.subCategory || ""}"`,
      h.quantity,
      h.avgBuyPrice,
      h.currentPrice,
      h.currentValue,
      h.unrealizedGain,
      `${h.gainPct.toFixed(2)}%`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `WealthPulse_Portfolio_Export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Import Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <UploadCloud className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Import Broker Statements</h2>
              <p className="text-xs text-slate-400">
                Upload Zerodha, Groww, Upstox, CAMS/KFintech CAS, or Universal CSV files
              </p>
            </div>
          </div>

          {/* Quick Sample Preloads */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Test Samples:</span>
            <button
              type="button"
              onClick={() => loadSample("/samples/zerodha_sample.csv", "zerodha_sample.csv")}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono transition-all"
            >
              Zerodha Sample
            </button>
            <button
              type="button"
              onClick={() => loadSample("/samples/groww_sample.csv", "groww_sample.csv")}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono transition-all"
            >
              Groww Sample
            </button>
            <button
              type="button"
              onClick={() => loadSample("/samples/nirmal_bang_sample.csv", "nirmal_bang_sample.csv")}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-mono transition-all"
            >
              Nirmal Bang Sample
            </button>
            <button
              type="button"
              onClick={() => loadSample("/samples/cams_cas_sample.csv", "cams_cas_sample.csv")}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono transition-all"
            >
              CAMS CAS Sample
            </button>
          </div>
        </div>

        {/* Upload Form Box */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Account & Entity *
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.familyMemberName} — {acc.name} ({acc.broker})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs text-slate-400">
              <span className="font-semibold text-slate-300 block">
                Automatic Broker Detection:
              </span>
              <p className="text-[11px] leading-relaxed">
                The parser inspects statement headers. If an asset symbol already exists in this account, quantities and prices update automatically without creating duplicate entries.
              </p>
            </div>
          </div>

          <div className="md:col-span-8 space-y-4">
            <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-6 text-center bg-slate-950/40 relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileSpreadsheet className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">
                {fileName ? fileName : "Drag & drop statement CSV here or click to browse"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports Zerodha (.csv), Groww (.csv), Upstox (.csv), CAS (.csv)
              </p>
            </div>

            {fileContent && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">
                    Preview: {fileName} ({fileContent.split("\n").length - 1} lines)
                  </span>
                  <button
                    onClick={() => {
                      setFileContent("");
                      setFileName("");
                    }}
                    className="text-rose-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 max-h-36 overflow-y-auto whitespace-pre">
                  {fileContent.slice(0, 1000)}
                  {fileContent.length > 1000 ? "\n..." : ""}
                </div>

                <button
                  type="button"
                  onClick={handleProcessImport}
                  disabled={uploading}
                  className="w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {uploading ? "Parsing & Importing..." : "Execute Statement Import"}
                </button>
              </div>
            )}

            {uploadStatus && (
              <div
                className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border ${
                  uploadStatus.success
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                }`}
              >
                {uploadStatus.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                )}
                <span>{uploadStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div id="export" className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Download className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Export Portfolio Reports</h2>
            <p className="text-xs text-slate-400">
              Download comprehensive spreadsheets and tax statements
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Export Full Holdings */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div>
              <h3 className="font-bold text-slate-200 text-sm">Consolidated Holdings CSV</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Full snapshot of all family holdings, buy prices, market values, and returns
              </p>
            </div>
            <button
              onClick={downloadPortfolioCSV}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Download Holdings CSV</span>
            </button>
          </div>

          {/* Export Universal Template */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div>
              <h3 className="font-bold text-slate-200 text-sm">Universal Template CSV</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Download pre-formatted WealthPulse CSV template to populate in Excel or Google Sheets
              </p>
            </div>
            <a
              href="/samples/universal_template.csv"
              download="wealthpulse_universal_template.csv"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors text-center"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-blue-400" />
              <span>Download Blank Template</span>
            </a>
          </div>

          {/* Print / PDF Summary */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div>
              <h3 className="font-bold text-slate-200 text-sm">Executive Balance Sheet</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Print or save PDF of your family wealth balance sheet for family records
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-purple-400" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Import History Log */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <h3 className="text-base font-bold text-white">Import History & Audit Trail</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 px-3">Timestamp</th>
                <th className="pb-3 px-3">File Name</th>
                <th className="pb-3 px-3">Detected Source</th>
                <th className="pb-3 px-3 text-right">Records</th>
                <th className="pb-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/20">
                  <td className="py-3 px-3 text-slate-400 font-sans">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="py-3 px-3 text-slate-200 font-semibold">
                    {log.fileName}
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-sans">
                    {log.broker}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                    {log.recordCount}
                  </td>
                  <td className="py-3 px-3 text-center font-sans">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
