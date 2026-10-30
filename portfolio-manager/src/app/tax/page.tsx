import { getTaxCalculationData } from "@/lib/actions";
import { formatINR, formatDate, formatPercent } from "@/lib/formatters";
import { Receipt, Sparkles, AlertTriangle, ShieldCheck, Download, HelpCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { member?: string };
}

export default async function TaxPage({ searchParams }: PageProps) {
  const memberId = searchParams?.member;
  const { realizedReport, unrealizedReport } = await getTaxCalculationData(memberId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Capital Gains Tax & Harvesting Hub
            </h1>
            <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              FY 2024-25 Budget Compliant
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Indian Income Tax Act Section 112A / 111A audit with ₹1.25 Lakh LTCG exemption tracking
          </p>
        </div>
      </div>

      {/* Tax Exemption Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center shadow-xl">
        <div className="space-y-1">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            ₹1.25L LTCG Exemption Status
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatINR(realizedReport.equityExemptionApplied)} / ₹1,25,000
          </div>
          <div className="text-[11px] text-slate-400">
            {realizedReport.equityExemptionApplied < 125000 ? (
              <span className="text-emerald-400 font-medium">
                ₹{(125000 - realizedReport.equityExemptionApplied).toLocaleString("en-IN")} exemption remaining to harvest!
              </span>
            ) : (
              <span className="text-amber-400 font-medium">Full exemption utilized</span>
            )}
          </div>
        </div>

        <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 md:pl-6">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Realized Equity LTCG (@ 12.5%)
          </div>
          <div className="text-xl font-bold text-slate-200 font-mono">
            {formatINR(realizedReport.equityLtcgTotal)}
          </div>
          <div className="text-[11px] text-slate-400">
            Taxable: {formatINR(realizedReport.netTaxableEquityLtcg)}
          </div>
        </div>

        <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 md:pl-6">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Realized Equity STCG (@ 20%)
          </div>
          <div className="text-xl font-bold text-slate-200 font-mono">
            {formatINR(realizedReport.equityStcgTotal)}
          </div>
          <div className="text-[11px] text-slate-400">Held &lt;= 12 months</div>
        </div>

        <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 md:pl-6">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Estimated Total Tax
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {formatINR(realizedReport.estimatedTotalTax)}
          </div>
          <div className="text-[11px] text-slate-400">Based on booked trades</div>
        </div>
      </div>

      {/* Tax Harvesting Opportunity Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                Unrealized Gains & Tax-Loss / Gain Harvesting Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Identify long-term holdings you can sell and re-buy to reset cost basis tax-free up to ₹1.25 Lakh
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 px-3">Asset</th>
                <th className="pb-3 px-3">Holding Period</th>
                <th className="pb-3 px-3 text-center">Tax Category</th>
                <th className="pb-3 px-3 text-right">Cost Basis</th>
                <th className="pb-3 px-3 text-right">Current Value</th>
                <th className="pb-3 px-3 text-right">Unrealized Gain</th>
                <th className="pb-3 px-3 text-right">Applicable Rate</th>
                <th className="pb-3 px-3 text-center">Harvest Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {unrealizedReport.lots.map((lot) => {
                const canHarvestTaxFree =
                  lot.isLongTerm &&
                  lot.gain > 0 &&
                  lot.gain <= 125000 &&
                  (lot.assetClass === "EQUITY" || lot.assetClass === "MUTUAL_FUND");

                return (
                  <tr key={lot.id} className="hover:bg-slate-800/20">
                    <td className="py-3 px-3 font-sans">
                      <div className="font-bold text-slate-200">{lot.symbol}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs font-mono">
                        {lot.holdingName}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-300">
                      <div>{lot.holdingDays} days</div>
                      <div className="text-[10px] text-slate-500 font-sans">
                        Bought: {formatDate(lot.buyDate)}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          lot.isLongTerm
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {lot.isLongTerm ? "LTCG (Long-Term)" : "STCG (Short-Term)"}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right text-slate-400">
                      {formatINR(lot.costBasis)}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-200 font-bold">
                      {formatINR(lot.saleValue)}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span
                        className={`font-bold ${
                          lot.gain >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {lot.gain >= 0 ? "+" : ""}
                        {formatINR(lot.gain)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right text-slate-300">
                      {(lot.applicableRate * 100).toFixed(1)}%
                    </td>

                    <td className="py-3 px-3 text-center font-sans">
                      {canHarvestTaxFree ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          ✨ 100% Tax-Free Harvest
                        </span>
                      ) : lot.gain < 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                          Tax Loss Harvest
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Hold</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rules Explainer Box */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
        <h4 className="font-bold text-slate-200 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-emerald-400" />
          Indian Income Tax (Budget 2024 Provisions) Applied:
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed text-slate-300">
          <li>
            <strong>Listed Equity & Equity Mutual Funds</strong>: STCG taxed at flat <strong>20%</strong> (holding &le; 12 months). LTCG taxed at <strong>12.5%</strong> on gains exceeding the <strong>₹1,25,000</strong> annual exemption limit per PAN.
          </li>
          <li>
            <strong>Real Estate</strong>: Holding period &gt; 24 months qualifies for LTCG taxed at <strong>12.5%</strong> without indexation.
          </li>
          <li>
            <strong>Sovereign Gold Bonds (SGB)</strong>: Capital gains on redemption upon full 8-year maturity with the Reserve Bank of India are <strong>100% Tax Exempt</strong> under Section 47.
          </li>
        </ul>
      </div>
    </div>
  );
}
