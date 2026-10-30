/**
 * Indian Capital Gains Tax (STCG & LTCG) Engine
 * Reflects latest post-Budget 2024 provisions:
 * - Listed Equity & Equity MFs: STCG @ 20% (<=12m), LTCG @ 12.5% (>12m, ₹1.25 Lakh exemption)
 * - Real Estate: LTCG (>24m) @ 12.5%, STCG (<=24m) at slab
 * - Sovereign Gold Bonds: Tax-free at 8-yr maturity; LTCG >12m @ 12.5% on exchange
 */

export interface TaxLot {
  id: string;
  holdingName: string;
  symbol: string;
  assetClass: string;
  buyDate: Date;
  sellDate: Date;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  costBasis: number;
  saleValue: number;
  gain: number;
  holdingDays: number;
  isLongTerm: boolean;
  applicableRate: number; // e.g. 0.125 or 0.20
  estimatedTax: number;
}

export interface TaxReportSummary {
  financialYear: string;
  totalRealizedGains: number;
  equityLtcgTotal: number;
  equityStcgTotal: number;
  otherLtcgTotal: number;
  otherStcgTotal: number;
  equityExemptionApplied: number;
  netTaxableEquityLtcg: number;
  estimatedTotalTax: number;
  lots: TaxLot[];
}

export function evaluateTaxLot(params: {
  id: string;
  holdingName: string;
  symbol: string;
  assetClass: string;
  buyDate: Date;
  sellDate: Date;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
}): TaxLot {
  const { id, holdingName, symbol, assetClass, buyDate, sellDate, quantity, buyPrice, sellPrice } = params;

  const costBasis = quantity * buyPrice;
  const saleValue = quantity * sellPrice;
  const gain = saleValue - costBasis;

  const diffTime = Math.abs(sellDate.getTime() - buyDate.getTime());
  const holdingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let isLongTerm = false;
  let rate = 0.20; // default STCG

  if (assetClass === "EQUITY" || assetClass === "MUTUAL_FUND") {
    // 12 months = 365 days
    isLongTerm = holdingDays > 365;
    rate = isLongTerm ? 0.125 : 0.20;
  } else if (assetClass === "REAL_ESTATE") {
    // 24 months = 730 days
    isLongTerm = holdingDays > 730;
    rate = isLongTerm ? 0.125 : 0.30; // assume 30% slab for STCG
  } else if (assetClass === "COMMODITY") {
    // Physical/ETF: 12 months for ETF, 24 months for bullion
    isLongTerm = holdingDays > 365;
    rate = isLongTerm ? 0.125 : 0.30;
  } else {
    // Debt & Fixed Income: slab rate
    rate = 0.30;
  }

  // Pre-tax computation before ₹1.25L exemption (applied at portfolio level)
  const estimatedTax = gain > 0 ? gain * rate : 0;

  return {
    id,
    holdingName,
    symbol,
    assetClass,
    buyDate,
    sellDate,
    quantity,
    buyPrice,
    sellPrice,
    costBasis,
    saleValue,
    gain,
    holdingDays,
    isLongTerm,
    applicableRate: rate,
    estimatedTax,
  };
}

export function compileTaxReport(lots: TaxLot[], financialYear: string = "FY 2024-25"): TaxReportSummary {
  let equityLtcgTotal = 0;
  let equityStcgTotal = 0;
  let otherLtcgTotal = 0;
  let otherStcgTotal = 0;

  for (const lot of lots) {
    if (lot.assetClass === "EQUITY" || lot.assetClass === "MUTUAL_FUND") {
      if (lot.isLongTerm) {
        equityLtcgTotal += lot.gain;
      } else {
        equityStcgTotal += lot.gain;
      }
    } else {
      if (lot.isLongTerm) {
        otherLtcgTotal += lot.gain;
      } else {
        otherStcgTotal += lot.gain;
      }
    }
  }

  const equityExemptionLimit = 125000; // ₹1,25,000 annual exemption
  const equityExemptionApplied = Math.min(Math.max(0, equityLtcgTotal), equityExemptionLimit);
  const netTaxableEquityLtcg = Math.max(0, equityLtcgTotal - equityExemptionApplied);

  const equityLtcgTax = netTaxableEquityLtcg * 0.125;
  const equityStcgTax = Math.max(0, equityStcgTotal) * 0.20;
  const otherLtcgTax = Math.max(0, otherLtcgTotal) * 0.125;
  const otherStcgTax = Math.max(0, otherStcgTotal) * 0.30;

  const estimatedTotalTax = equityLtcgTax + equityStcgTax + otherLtcgTax + otherStcgTax;

  return {
    financialYear,
    totalRealizedGains: equityLtcgTotal + equityStcgTotal + otherLtcgTotal + otherStcgTotal,
    equityLtcgTotal,
    equityStcgTotal,
    otherLtcgTotal,
    otherStcgTotal,
    equityExemptionApplied,
    netTaxableEquityLtcg,
    estimatedTotalTax,
    lots,
  };
}
