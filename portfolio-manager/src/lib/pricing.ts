/**
 * Real-Time & EOD Market Pricing Engine
 *
 * 1. Indian Equities & ETFs (NSE/BSE):
 *    Fetches live / 15-min delayed market quotes from Yahoo Finance API using .NS suffix
 *    with a 600ms throttle to prevent HTTP 429 rate limits.
 *
 * 2. Mutual Funds (AMFI):
 *    Fetches latest official Net Asset Value (NAV) from the AMFI API (api.mfapi.in).
 *
 * 3. Commodities:
 *    Gold / Silver ETFs & SGBs traded on NSE (GOLDBEES, SILVERBEES, SGBNOV29).
 */

export interface PriceQuote {
  symbol: string;
  price: number;
  currency: string;
  change?: number;
  changePercent?: number;
  source: "YAHOO_NSE" | "AMFI_NAV" | "FALLBACK";
}

export async function fetchStockQuote(symbol: string): Promise<PriceQuote | null> {
  const cleanSymbol = symbol.trim().toUpperCase();

  // Try NSE first (.NS), then BSE (.BO)
  const tickers = [`${cleanSymbol}.NS`, `${cleanSymbol}.BO`];

  for (const ticker of tickers) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        ticker
      )}?interval=1d&range=1d`;

      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      });

      if (!res.ok) continue;

      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      const regularMarketPrice = meta?.regularMarketPrice;

      if (typeof regularMarketPrice === "number" && regularMarketPrice > 0) {
        const prevClose = meta?.chartPreviousClose || meta?.previousClose || regularMarketPrice;
        const change = regularMarketPrice - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

        return {
          symbol: cleanSymbol,
          price: regularMarketPrice,
          currency: meta?.currency || "INR",
          change,
          changePercent,
          source: "YAHOO_NSE",
        };
      }
    } catch {
      // Continue to next ticker variation
    }
  }

  return null;
}

export async function fetchMutualFundNAV(amfiCodeOrName: string): Promise<PriceQuote | null> {
  const numericCode = amfiCodeOrName.replace(/\D/g, "");

  if (numericCode && numericCode.length >= 5) {
    try {
      const res = await fetch(`https://api.mfapi.in/mf/${numericCode}`);

      if (res.ok) {
        const data = await res.json();
        const latestEntry = data?.data?.[0];
        if (latestEntry && latestEntry.nav) {
          const nav = parseFloat(latestEntry.nav);
          if (!isNaN(nav) && nav > 0) {
            return {
              symbol: amfiCodeOrName,
              price: nav,
              currency: "INR",
              source: "AMFI_NAV",
            };
          }
        }
      }
    } catch {}
  }

  return null;
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
