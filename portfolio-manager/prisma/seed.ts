import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding WealthPulse database with family portfolio data...");

  // Clean existing data
  await prisma.importLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.account.deleteMany();
  await prisma.familyMember.deleteMany();

  // 1. Create Family Members
  const vineet = await prisma.familyMember.create({
    data: {
      name: "Vineet Gori",
      relationship: "Self",
      pan: "ABCPG1234F",
      avatarColor: "#3b82f6", // Blue
      targetEquityPct: 55,
      targetDebtPct: 15,
      targetGoldPct: 15,
      targetRealEstatePct: 15,
    },
  });

  const ananya = await prisma.familyMember.create({
    data: {
      name: "Ananya Gori",
      relationship: "Spouse",
      pan: "ABCPG5678G",
      avatarColor: "#ec4899", // Pink
      targetEquityPct: 40,
      targetDebtPct: 30,
      targetGoldPct: 20,
      targetRealEstatePct: 10,
    },
  });

  const rajesh = await prisma.familyMember.create({
    data: {
      name: "Rajesh Gori",
      relationship: "Father",
      pan: "ABCPG9012H",
      avatarColor: "#10b981", // Emerald
      targetEquityPct: 25,
      targetDebtPct: 55,
      targetGoldPct: 20,
      targetRealEstatePct: 0,
    },
  });

  const huf = await prisma.familyMember.create({
    data: {
      name: "Vineet Gori HUF",
      relationship: "HUF",
      pan: "AABCG3456J",
      avatarColor: "#8b5cf6", // Purple
      targetEquityPct: 30,
      targetDebtPct: 20,
      targetGoldPct: 10,
      targetRealEstatePct: 40,
    },
  });

  // 2. Create Accounts across Broking firms
  const vineetZerodha = await prisma.account.create({
    data: {
      familyMemberId: vineet.id,
      name: "Vineet Zerodha Kite",
      broker: "Zerodha",
      accountType: "DEMAT",
      accountNumber: "ZR881923",
    },
  });

  const vineetGroww = await prisma.account.create({
    data: {
      familyMemberId: vineet.id,
      name: "Vineet Groww MFs",
      broker: "Groww",
      accountType: "MUTUAL_FUND",
      accountNumber: "GW772019",
    },
  });

  const ananyaUpstox = await prisma.account.create({
    data: {
      familyMemberId: ananya.id,
      name: "Ananya Upstox Demat",
      broker: "Upstox",
      accountType: "DEMAT",
      accountNumber: "UP551204",
    },
  });

  const ananyaHdfc = await prisma.account.create({
    data: {
      familyMemberId: ananya.id,
      name: "Ananya HDFC Savings & FDs",
      broker: "HDFC Bank",
      accountType: "SAVINGS_FD",
      accountNumber: "HDFC998271",
    },
  });

  const rajeshIcici = await prisma.account.create({
    data: {
      familyMemberId: rajesh.id,
      name: "Rajesh ICICI Direct Demat & FDs",
      broker: "ICICI Direct",
      accountType: "DEMAT",
      accountNumber: "IC112349",
    },
  });

  const familyLocker = await prisma.account.create({
    data: {
      familyMemberId: vineet.id,
      name: "Family Vault & Bullion",
      broker: "Physical/Registry",
      accountType: "COMMODITY_VAULT",
      accountNumber: "VAULT-B12",
    },
  });

  const hufRealty = await prisma.account.create({
    data: {
      familyMemberId: huf.id,
      name: "HUF Commercial Real Estate",
      broker: "Physical/Registry",
      accountType: "REAL_ESTATE",
      accountNumber: "DEED-KA-ORR-04",
    },
  });

  const vineetRealty = await prisma.account.create({
    data: {
      familyMemberId: vineet.id,
      name: "Vineet Whitefield Apartment",
      broker: "Physical/Registry",
      accountType: "REAL_ESTATE",
      accountNumber: "DEED-KA-WFD-108",
    },
  });

  // 3. Create Holdings & Transactions
  // Equities in Vineet Zerodha
  const tcs = await prisma.holding.create({
    data: {
      accountId: vineetZerodha.id,
      symbol: "TCS",
      name: "Tata Consultancy Services Ltd",
      isin: "INE467B01029",
      assetClass: "EQUITY",
      subCategory: "Large Cap",
      quantity: 120,
      avgBuyPrice: 3450.0,
      currentPrice: 4180.0,
      sector: "Information Technology",
      notes: "Core compounding holding",
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        accountId: vineetZerodha.id,
        holdingId: tcs.id,
        type: "BUY",
        date: new Date("2022-04-10"),
        quantity: 60,
        price: 3300,
        amount: -198000,
      },
      {
        accountId: vineetZerodha.id,
        holdingId: tcs.id,
        type: "BUY",
        date: new Date("2023-01-15"),
        quantity: 60,
        price: 3600,
        amount: -216000,
      },
      {
        accountId: vineetZerodha.id,
        holdingId: tcs.id,
        type: "DIVIDEND",
        date: new Date("2024-06-20"),
        quantity: 120,
        price: 28,
        amount: 3360,
        notes: "Interim Dividend @ ₹28/share",
      },
    ],
  });

  const reliance = await prisma.holding.create({
    data: {
      accountId: vineetZerodha.id,
      symbol: "RELIANCE",
      name: "Reliance Industries Ltd",
      isin: "INE002A01018",
      assetClass: "EQUITY",
      subCategory: "Large Cap",
      quantity: 150,
      avgBuyPrice: 2420.0,
      currentPrice: 2890.0,
      sector: "Energy & Conglomerate",
    },
  });

  await prisma.transaction.create({
    data: {
      accountId: vineetZerodha.id,
      holdingId: reliance.id,
      type: "BUY",
      date: new Date("2022-08-18"),
      quantity: 150,
      price: 2420,
      amount: -363000,
    },
  });

  const dixon = await prisma.holding.create({
    data: {
      accountId: vineetZerodha.id,
      symbol: "DIXON",
      name: "Dixon Technologies (India) Ltd",
      isin: "INE935N01020",
      assetClass: "EQUITY",
      subCategory: "Mid Cap",
      quantity: 35,
      avgBuyPrice: 6200.0,
      currentPrice: 12450.0,
      sector: "Consumer Electronics",
      notes: "Multibagger manufacturing play",
    },
  });

  await prisma.transaction.create({
    data: {
      accountId: vineetZerodha.id,
      holdingId: dixon.id,
      type: "BUY",
      date: new Date("2023-05-12"),
      quantity: 35,
      price: 6200,
      amount: -217000,
    },
  });

  // SGB in Vineet Zerodha
  const sgb = await prisma.holding.create({
    data: {
      accountId: vineetZerodha.id,
      symbol: "SGBNOV29",
      name: "Sovereign Gold Bond 2021-22 Series VIII",
      isin: "IN0020210214",
      assetClass: "COMMODITY",
      subCategory: "Gold SGB",
      quantity: 50, // 50 grams
      avgBuyPrice: 4800.0,
      currentPrice: 7750.0,
      notes: "Semi-annual 2.5% interest + tax free at maturity",
      metadata: JSON.stringify({
        maturityDate: "2029-11-20",
        annualInterestPct: 2.5,
        payoutMonths: ["May", "November"],
      }),
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        accountId: vineetZerodha.id,
        holdingId: sgb.id,
        type: "BUY",
        date: new Date("2021-11-20"),
        quantity: 50,
        price: 4800,
        amount: -240000,
      },
      {
        accountId: vineetZerodha.id,
        holdingId: sgb.id,
        type: "INTEREST",
        date: new Date("2024-05-20"),
        quantity: 50,
        price: 60,
        amount: 3000,
        notes: "Semi-annual 2.5% SGB Coupon Interest",
      },
    ],
  });

  // Mutual Funds in Vineet Groww
  const ppfas = await prisma.holding.create({
    data: {
      accountId: vineetGroww.id,
      symbol: "PPFAS_FLEXICAP",
      name: "Parag Parikh Flexi Cap Direct Growth",
      isin: "INF879O01019",
      assetClass: "MUTUAL_FUND",
      subCategory: "Flexi Cap",
      quantity: 8250,
      avgBuyPrice: 52.4,
      currentPrice: 78.85,
      sector: "Diversified Equity",
      metadata: JSON.stringify({ folioNumber: "109823471/01", amfiCode: "122639" }),
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        accountId: vineetGroww.id,
        holdingId: ppfas.id,
        type: "BUY",
        date: new Date("2022-01-10"),
        quantity: 4000,
        price: 50.0,
        amount: -200000,
      },
      {
        accountId: vineetGroww.id,
        holdingId: ppfas.id,
        type: "BUY",
        date: new Date("2023-01-10"),
        quantity: 4250,
        price: 54.65,
        amount: -232262,
      },
    ],
  });

  const quantSmall = await prisma.holding.create({
    data: {
      accountId: vineetGroww.id,
      symbol: "QUANT_SMALLCAP",
      name: "Quant Small Cap Fund Direct Growth",
      isin: "INF966L01AA3",
      assetClass: "MUTUAL_FUND",
      subCategory: "Small Cap",
      quantity: 2150,
      avgBuyPrice: 165.0,
      currentPrice: 248.5,
      sector: "Small Cap Growth",
      metadata: JSON.stringify({ folioNumber: "912448102/09", amfiCode: "120828" }),
    },
  });

  await prisma.transaction.create({
    data: {
      accountId: vineetGroww.id,
      holdingId: quantSmall.id,
      type: "BUY",
      date: new Date("2022-09-05"),
      quantity: 2150,
      price: 165.0,
      amount: -354750,
    },
  });

  // Ananya Upstox Demat
  const hdfcBank = await prisma.holding.create({
    data: {
      accountId: ananyaUpstox.id,
      symbol: "HDFCBANK",
      name: "HDFC Bank Ltd",
      isin: "INE040A01034",
      assetClass: "EQUITY",
      subCategory: "Large Cap",
      quantity: 250,
      avgBuyPrice: 1510.0,
      currentPrice: 1785.0,
      sector: "Financial Services",
    },
  });

  await prisma.transaction.create({
    data: {
      accountId: ananyaUpstox.id,
      holdingId: hdfcBank.id,
      type: "BUY",
      date: new Date("2023-02-14"),
      quantity: 250,
      price: 1510.0,
      amount: -377500,
    },
  });

  const goldbees = await prisma.holding.create({
    data: {
      accountId: ananyaUpstox.id,
      symbol: "GOLDBEES",
      name: "Nippon India ETF Gold BeES",
      isin: "INF204KB14I2",
      assetClass: "COMMODITY",
      subCategory: "Gold ETF",
      quantity: 5000,
      avgBuyPrice: 51.5,
      currentPrice: 71.2,
      sector: "Commodity ETF",
    },
  });

  await prisma.transaction.create({
    data: {
      accountId: ananyaUpstox.id,
      holdingId: goldbees.id,
      type: "BUY",
      date: new Date("2022-11-10"),
      quantity: 5000,
      price: 51.5,
      amount: -257500,
    },
  });

  // Ananya HDFC Bank Fixed Deposits & Emergency Fund
  const hdfcFd = await prisma.holding.create({
    data: {
      accountId: ananyaHdfc.id,
      symbol: "HDFC_FD_2026",
      name: "HDFC Bank Cumulative Fixed Deposit",
      assetClass: "FIXED_INCOME",
      subCategory: "Fixed Deposit",
      quantity: 1,
      avgBuyPrice: 1000000, // 10 Lakhs
      currentPrice: 1145000,
      notes: "Emergency corpus locked at 7.25% p.a.",
      metadata: JSON.stringify({
        maturityDate: "2026-08-15",
        interestRate: 7.25,
        compounding: "Quarterly",
      }),
    },
  });

  // Rajesh ICICI Direct (Father)
  const itc = await prisma.holding.create({
    data: {
      accountId: rajeshIcici.id,
      symbol: "ITC",
      name: "ITC Ltd",
      isin: "INE154A01025",
      assetClass: "EQUITY",
      subCategory: "Large Cap",
      quantity: 1200,
      avgBuyPrice: 320.0,
      currentPrice: 472.0,
      sector: "FMCG",
      notes: "High dividend yield holding for retirement",
    },
  });

  await prisma.transaction.create({
    data: {
      accountId: rajeshIcici.id,
      holdingId: itc.id,
      type: "BUY",
      date: new Date("2021-06-25"),
      quantity: 1200,
      price: 320.0,
      amount: -384000,
    },
  });

  const iciciSrFd = await prisma.holding.create({
    data: {
      accountId: rajeshIcici.id,
      symbol: "ICICI_SR_CITIZEN_FD",
      name: "ICICI Senior Citizen Special FD",
      assetClass: "FIXED_INCOME",
      subCategory: "Fixed Deposit",
      quantity: 1,
      avgBuyPrice: 2500000, // 25 Lakhs
      currentPrice: 2820000,
      notes: "Quarterly interest payout for living expenses",
      metadata: JSON.stringify({
        maturityDate: "2027-03-31",
        interestRate: 7.75,
        quarterlyPayout: 48437,
      }),
    },
  });

  // Family Physical Gold Vault
  await prisma.holding.create({
    data: {
      accountId: familyLocker.id,
      symbol: "GOLD_24K_BARS",
      name: "MMTC-PAMP 24K 999.9 Fine Gold Bars (100g)",
      assetClass: "COMMODITY",
      subCategory: "Physical Bullion",
      quantity: 100, // 100 grams
      avgBuyPrice: 5350.0,
      currentPrice: 8120.0,
      notes: "Physical hallmarked bullion stored in safety locker",
    },
  });

  // Real Estate - Vineet Whitefield Residential Apartment
  const whitefieldFlat = await prisma.holding.create({
    data: {
      accountId: vineetRealty.id,
      symbol: "RE_WFD_3BHK",
      name: "Prestige Lakeside Habitat 3BHK Flat, Whitefield, Bengaluru",
      assetClass: "REAL_ESTATE",
      subCategory: "Residential Property",
      quantity: 1,
      avgBuyPrice: 12000000, // ₹1.20 Cr purchase cost + registration
      currentPrice: 18500000, // Current estimated market value ₹1.85 Cr
      notes: "Rented out at ₹52,000/month",
      metadata: JSON.stringify({
        carpetAreaSqFt: 1850,
        monthlyRental: 52000,
        rentalYieldPct: 3.37,
        tenantName: "Rajiv Sharma",
        leaseExpiry: "2025-11-30",
        mortgageOutstanding: 3200000,
      }),
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        accountId: vineetRealty.id,
        holdingId: whitefieldFlat.id,
        type: "BUY",
        date: new Date("2020-03-15"),
        quantity: 1,
        price: 12000000,
        amount: -12000000,
        notes: "Purchase Deed registration",
      },
      {
        accountId: vineetRealty.id,
        holdingId: whitefieldFlat.id,
        type: "RENT",
        date: new Date("2024-09-05"),
        quantity: 1,
        price: 52000,
        amount: 52000,
        notes: "September 2024 Rental Income",
      },
    ],
  });

  // Real Estate - HUF Commercial Office Space
  const orrCommercial = await prisma.holding.create({
    data: {
      accountId: hufRealty.id,
      symbol: "RE_ORR_COMMERCIAL",
      name: "Embassy TechVillage Grade-A Commercial Office, ORR Bengaluru",
      assetClass: "REAL_ESTATE",
      subCategory: "Commercial Property",
      quantity: 1,
      avgBuyPrice: 24000000, // ₹2.40 Cr
      currentPrice: 34000000, // ₹3.40 Cr
      notes: "9-year institutional lease with 15% escalation every 3 years",
      metadata: JSON.stringify({
        carpetAreaSqFt: 2400,
        monthlyRental: 180000,
        rentalYieldPct: 6.35,
        tenantName: "FinTech Innovations Global Pvt Ltd",
        leaseExpiry: "2029-05-31",
        mortgageOutstanding: 0,
      }),
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        accountId: hufRealty.id,
        holdingId: orrCommercial.id,
        type: "BUY",
        date: new Date("2019-10-10"),
        quantity: 1,
        price: 24000000,
        amount: -24000000,
      },
      {
        accountId: hufRealty.id,
        holdingId: orrCommercial.id,
        type: "RENT",
        date: new Date("2024-09-01"),
        quantity: 1,
        price: 180000,
        amount: 180000,
        notes: "September 2024 Commercial Lease Rental",
      },
    ],
  });

  // Create sample Import Logs
  await prisma.importLog.createMany({
    data: [
      {
        fileName: "zerodha_holdings_2024.csv",
        broker: "Zerodha",
        status: "SUCCESS",
        recordCount: 4,
        accountId: vineetZerodha.id,
      },
      {
        fileName: "groww_mf_cas_statement.csv",
        broker: "Groww",
        status: "SUCCESS",
        recordCount: 2,
        accountId: vineetGroww.id,
      },
    ],
  });

  console.log("Database seeded successfully with family portfolio data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
