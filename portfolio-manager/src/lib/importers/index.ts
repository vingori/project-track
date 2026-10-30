import Papa from "papaparse";

export interface ParsedHolding {
  symbol: string;
  name: string;
  isin?: string;
  assetClass: "EQUITY" | "MUTUAL_FUND" | "COMMODITY" | "REAL_ESTATE" | "FIXED_INCOME" | "CASH";
  subCategory?: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  sector?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface ParseResult {
  detectedBroker: string;
  holdings: ParsedHolding[];
  errors: string[];
}

export function parseStatementCSV(csvContent: string): ParseResult {
  const result: ParseResult = {
    detectedBroker: "Unknown",
    holdings: [],
    errors: [],
  };

  const parsed = Papa.parse<Record<string, any>>(csvContent.trim(), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors && parsed.errors.length > 0) {
    result.errors.push(...parsed.errors.map((e) => e.message));
  }

  const rows = parsed.data;
  if (!rows || rows.length === 0) {
    result.errors.push("CSV file contains no data rows.");
    return result;
  }

  const headers = Object.keys(rows[0] || {}).map((h) => h.toLowerCase());

  // 1. Detect Zerodha Holdings
  // Columns: Instrument, Qty., Avg. cost, LTP, Cur. val, P&L
  if (headers.includes("instrument") && (headers.includes("qty.") || headers.includes("qty")) && (headers.includes("avg. cost") || headers.includes("avg cost"))) {
    result.detectedBroker = "Zerodha";
    for (const r of rows) {
      const symbol = cleanString(r["Instrument"] || r["instrument"]);
      if (!symbol) continue;

      const qty = cleanNumber(r["Qty."] ?? r["qty."] ?? r["Qty"] ?? r["qty"]);
      const avg = cleanNumber(r["Avg. cost"] ?? r["avg. cost"] ?? r["Avg cost"]);
      const ltp = cleanNumber(r["LTP"] ?? r["ltp"] ?? avg);

      const isSgb = symbol.toUpperCase().startsWith("SGB");
      const isGoldEtf = symbol.toUpperCase().includes("GOLD") || symbol.toUpperCase().includes("GOLDBEES");
      const isSilverEtf = symbol.toUpperCase().includes("SILVER");

      result.holdings.push({
        symbol: symbol.toUpperCase(),
        name: symbol,
        assetClass: isSgb || isGoldEtf || isSilverEtf ? "COMMODITY" : "EQUITY",
        subCategory: isSgb ? "Gold SGB" : isGoldEtf ? "Gold ETF" : isSilverEtf ? "Silver ETF" : "Stock",
        quantity: qty,
        avgBuyPrice: avg,
        currentPrice: ltp,
      });
    }
    return result;
  }

  // 2. Detect Groww Holdings (Stocks or MFs)
  // Columns: Stock Name / Scheme Name, Symbol / Folio No, Quantity / Units, Average Price, LTP / Current NAV
  if (
    headers.some((h) => h.includes("stock name") || h.includes("scheme name")) &&
    headers.some((h) => h.includes("quantity") || h.includes("units"))
  ) {
    result.detectedBroker = "Groww";
    for (const r of rows) {
      const isMf = Boolean(r["Scheme Name"] || r["scheme name"] || r["Folio No"] || r["folio no"]);
      const name = cleanString(r["Stock Name"] || r["stock name"] || r["Scheme Name"] || r["scheme name"]);
      const symbol = cleanString(r["Symbol"] || r["symbol"] || name);
      if (!name && !symbol) continue;

      const qty = cleanNumber(r["Quantity"] ?? r["quantity"] ?? r["Units"] ?? r["units"]);
      const avg = cleanNumber(r["Average Price"] ?? r["average price"] ?? r["Average NAV"] ?? r["average nav"]);
      const ltp = cleanNumber(r["Current Market Price"] ?? r["current market price"] ?? r["Current NAV"] ?? r["current nav"] ?? r["LTP"] ?? avg);

      result.holdings.push({
        symbol: symbol ? symbol.toUpperCase() : name.toUpperCase().slice(0, 15),
        name: name || symbol,
        isin: cleanString(r["ISIN"] || r["isin"]),
        assetClass: isMf ? "MUTUAL_FUND" : "EQUITY",
        subCategory: isMf ? "Mutual Fund" : "Stock",
        quantity: qty,
        avgBuyPrice: avg,
        currentPrice: ltp,
      });
    }
    return result;
  }

  // 3. Detect Upstox Holdings
  // Columns: Company Name, Symbol, ISIN, Quantity, Buy Average Price, LTP
  if (headers.includes("company name") && headers.includes("symbol") && headers.some((h) => h.includes("buy average") || h.includes("ltp"))) {
    result.detectedBroker = "Upstox";
    for (const r of rows) {
      const symbol = cleanString(r["Symbol"] || r["symbol"]);
      const name = cleanString(r["Company Name"] || r["company name"] || symbol);
      if (!symbol && !name) continue;

      const qty = cleanNumber(r["Quantity"] ?? r["quantity"]);
      const avg = cleanNumber(r["Buy Average Price"] ?? r["buy average price"] ?? r["Average Price"]);
      const ltp = cleanNumber(r["LTP"] ?? r["ltp"] ?? avg);

      result.holdings.push({
        symbol: symbol.toUpperCase(),
        name: name,
        isin: cleanString(r["ISIN"] || r["isin"]),
        assetClass: "EQUITY",
        subCategory: "Stock",
        quantity: qty,
        avgBuyPrice: avg,
        currentPrice: ltp,
      });
    }
    return result;
  }

  // 4. Detect Nirmal Bang Holdings / Tradebook
  // Columns typically: Scrip Name / Security Name, Scrip Code / Symbol, Qty / Net Qty, Avg Rate / Buy Avg, Market Rate / CMP / LTP
  if (
    headers.some((h) => h.includes("scrip") || h.includes("security")) &&
    headers.some((h) => h.includes("rate") || h.includes("avg") || h.includes("qty"))
  ) {
    result.detectedBroker = "Nirmal Bang";
    for (const r of rows) {
      const name = cleanString(
        r["Scrip Name"] || r["scrip name"] || r["Security Name"] || r["security name"] || r["Company"]
      );
      const symbol = cleanString(
        r["Symbol"] || r["symbol"] || r["Scrip Code"] || r["scrip code"] || name
      );
      if (!name && !symbol) continue;

      const qty = cleanNumber(
        r["Qty"] ?? r["qty"] ?? r["Net Qty"] ?? r["net qty"] ?? r["Quantity"] ?? r["quantity"]
      );
      const avg = cleanNumber(
        r["Avg Rate"] ?? r["avg rate"] ?? r["Buy Avg"] ?? r["buy avg"] ?? r["Average Rate"] ?? r["Rate"]
      );
      const ltp = cleanNumber(
        r["Market Rate"] ?? r["market rate"] ?? r["CMP"] ?? r["cmp"] ?? r["LTP"] ?? r["ltp"] ?? avg
      );

      result.holdings.push({
        symbol: (symbol || name).toUpperCase().replace(/\s+/g, ""),
        name: name || symbol,
        isin: cleanString(r["ISIN"] || r["isin"]),
        assetClass: "EQUITY",
        subCategory: "Stock",
        quantity: qty,
        avgBuyPrice: avg,
        currentPrice: ltp,
      });
    }
    return result;
  }

  // 5. Detect CAMS / KFintech CAS Mutual Funds Statement
  // Columns: Scheme Name, Folio Number, Units, Cost Value, Current Value, NAV
  if (headers.some((h) => h.includes("scheme") || h.includes("folio")) && headers.some((h) => h.includes("units") || h.includes("nav"))) {
    result.detectedBroker = "CAMS/KFintech CAS";
    for (const r of rows) {
      const name = cleanString(r["Scheme Name"] || r["scheme name"] || r["Scheme"] || r["scheme"]);
      if (!name) continue;

      const qty = cleanNumber(r["Units"] ?? r["units"] ?? r["Balance Units"] ?? r["balance units"]);
      const nav = cleanNumber(r["NAV"] ?? r["nav"] ?? r["Current NAV"] ?? r["current nav"]);
      const costVal = cleanNumber(r["Cost Value"] ?? r["cost value"] ?? r["Invested Value"] ?? r["invested value"]);
      const avg = qty > 0 && costVal > 0 ? costVal / qty : nav;

      const folio = cleanString(r["Folio Number"] || r["folio number"] || r["Folio No"]);
      const isin = cleanString(r["ISIN"] || r["isin"]);

      result.holdings.push({
        symbol: name.replace(/\s+/g, "_").slice(0, 24).toUpperCase(),
        name: name,
        isin: isin,
        assetClass: "MUTUAL_FUND",
        subCategory: "Mutual Fund",
        quantity: qty,
        avgBuyPrice: avg,
        currentPrice: nav || avg,
        metadata: folio ? { folioNumber: folio } : undefined,
      });
    }
    return result;
  }

  // 5. Universal WealthPulse CSV Format
  // Header expects: symbol, name, assetClass, quantity, avgBuyPrice, currentPrice
  result.detectedBroker = "Universal WealthPulse Template";
  for (const r of rows) {
    const symbol = cleanString(r["symbol"] || r["Symbol"] || r["SYMBOL"]);
    const name = cleanString(r["name"] || r["Name"] || r["NAME"] || symbol);
    if (!symbol && !name) continue;

    const rawClass = (r["asset_class"] || r["assetClass"] || r["AssetClass"] || r["Asset Class"] || "EQUITY").toString().toUpperCase();
    let assetClass: ParsedHolding["assetClass"] = "EQUITY";
    if (rawClass.includes("FUND") || rawClass === "MF" || rawClass === "MUTUAL_FUND") assetClass = "MUTUAL_FUND";
    else if (rawClass.includes("COMMODITY") || rawClass.includes("GOLD") || rawClass.includes("SILVER")) assetClass = "COMMODITY";
    else if (rawClass.includes("REAL") || rawClass.includes("PROPERTY") || rawClass.includes("REAL_ESTATE")) assetClass = "REAL_ESTATE";
    else if (rawClass.includes("FIXED") || rawClass.includes("DEBT") || rawClass.includes("FD") || rawClass.includes("PPF")) assetClass = "FIXED_INCOME";
    else if (rawClass.includes("CASH") || rawClass.includes("BANK")) assetClass = "CASH";

    const qty = cleanNumber(r["quantity"] ?? r["Quantity"] ?? r["Qty"] ?? 1);
    const avg = cleanNumber(r["avg_buy_price"] ?? r["avgBuyPrice"] ?? r["Avg Buy Price"] ?? r["Buy Price"] ?? 0);
    const current = cleanNumber(r["current_price"] ?? r["currentPrice"] ?? r["Current Price"] ?? avg);
    const subCat = cleanString(r["sub_category"] || r["subCategory"] || r["Sub Category"]);
    const sector = cleanString(r["sector"] || r["Sector"]);
    const notes = cleanString(r["notes"] || r["Notes"]);

    result.holdings.push({
      symbol: (symbol || name).toUpperCase(),
      name: name || symbol,
      isin: cleanString(r["isin"] || r["ISIN"]),
      assetClass,
      subCategory: subCat,
      quantity: qty,
      avgBuyPrice: avg,
      currentPrice: current,
      sector,
      notes,
    });
  }

  return result;
}

function cleanString(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function cleanNumber(val: any): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  // Remove commas, currency symbols, percentage signs
  const cleaned = String(val).replace(/[₹$,%\s]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
