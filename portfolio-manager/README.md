# WealthPulse - Multi-Account Family Portfolio Management System (PMS)

WealthPulse is an enterprise-grade, privacy-focused, local-first Portfolio Management System tailored for Indian families managing multi-asset investments across diverse broking houses, banks, physical vaults, and real estate deeds.

---

## 🌟 Core Feature Matrix

### 1. Multi-Entity & Family Account Hierarchy
- **Family Members**: Track wealth across multiple PAN identities (e.g., Self, Spouse, Father, Mother, HUF / Family Trusts).
- **Multiple Broking Firms**: Simultaneously aggregate accounts across:
  - **Zerodha Kite**
  - **Groww**
  - **Upstox**
  - **ICICI Direct**
  - **HDFC Sky / Bank**
  - **Physical Vaults & Safety Lockers** (Hallmarked 24K Gold & Silver Bullion)
  - **Property Deeds** (Residential apartments, commercial real estate, plots)
- **Consolidated vs Drill-Down View**: Toggle between 1-Click Consolidated Family Wealth and individual entity portfolios.

### 2. Multi-Asset Class Coverage
- **Direct Equities (Stocks)**: NSE/BSE tickers, ISINs, buy/sell lots, real-time unrealized and realized P&L, sector tagging.
- **Mutual Funds (MFs)**: AMFI scheme codes, NAV tracking, SIP and lump-sum investments, CAMS / KFintech CAS statement parsing.
- **Commodities**: Sovereign Gold Bonds (SGB - coupon interest + tax-free redemption), Physical Bullion (24K Gold bars), Gold & Silver ETFs.
- **Real Estate**: Commercial and residential properties, acquisition costs, current market valuations, monthly rental yields, and outstanding mortgage tracking.
- **Fixed Income & Debt**: Fixed Deposits (FDs), PPF, EPF, NPS, interest compounding, and maturity date countdowns.

### 3. Quantitative Financial Analytics & Insights
- **Extended Internal Rate of Return (XIRR)**: Custom numerical Newton-Raphson engine with bisection fallback to calculate true annualized money-weighted returns across irregular cashflows (SIPs, dividends, lump sums).
- **Asset Allocation Drift & Rebalancing Simulator**: Compare actual weights against target allocations (e.g. 50% Equity, 20% Debt, 15% Gold, 15% Real Estate). Enter fresh capital to calculate exact ₹ amounts to buy or trim.
- **Risk & Concentration Alerts**: Real-time alerts when any single equity holding exceeds 10% of portfolio value.
- **Passive Income & Yield Calendar**: Aggregates monthly rental cashflows, quarterly FD interest payouts, and semi-annual SGB coupons.

### 4. Statement Importers & Exporters
- **Auto-Detect CSV Importers**:
  - Zerodha Holdings / Tradebook
  - Groww Holdings Statement
  - Upstox Portfolio Export
  - CAMS / KFintech CAS (Mutual Funds)
  - Universal WealthPulse CSV Template
- **Data Deduplication**: Intelligent update mechanism updates quantities and prices for existing symbols without duplicate ledger entries.
- **Instant Exporters**:
  - Full Consolidated Portfolio Snapshot (.csv)
  - Capital Gains Tax Statement (.csv)
  - Blank Universal Import Template (.csv)
  - Executive Family Balance Sheet (Printer/PDF ready)

### 5. Indian Income Tax & Harvesting Hub (Budget 2024 Compliant)
- **Section 112A (LTCG)**: 12.5% on gains exceeding the ₹1,25,000 annual exemption limit.
- **Section 111A (STCG)**: Flat 20% on short-term equity gains (holding $\le$ 12 months).
- **Tax-Loss & Tax-Gain Harvesting Simulator**: Highlights positions that can be harvested tax-free before the financial year ends.
- **SGB Tax-Free Status**: Tracks 8-year RBI redemption exemptions under Section 47.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested with Node v22)
- npm or yarn

### Installation & Launch

```bash
# 1. Navigate to the project directory
cd portfolio-manager

# 2. Database Sync & Sample Data Seeding
npx prisma db push
npx tsx prisma/seed.ts

# 3. Start Development Server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🔒 100% Privacy & Local-First Architecture
All family financial data, demat holdings, PAN numbers, and property records reside in a local SQLite database (`portfolio-manager/prisma/portfolio.db`). No cloud API keys or third-party credential handoffs required.
