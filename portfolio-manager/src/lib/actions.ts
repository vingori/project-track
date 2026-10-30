"use server";

import { prisma } from "./prisma";
import { calculateXIRR, CashFlow } from "./xirr";
import { parseStatementCSV } from "./importers";
import { evaluateTaxLot, compileTaxReport } from "./tax";
import { fetchStockQuote, fetchMutualFundNAV, delay } from "./pricing";
import { revalidatePath } from "next/cache";

export interface PortfolioSummary {
  totalNetWorth: number;
  totalInvested: number;
  totalUnrealizedGain: number;
  totalGainPct: number;
  realizedGains: number;
  annualDividendIncome: number;
  monthlyRentalIncome: number;
  portfolioXIRR: number | null;
  familyMembers: Array<{
    id: string;
    name: string;
    relationship: string;
    avatarColor: string;
    accountCount: number;
    totalValue: number;
  }>;
  assetClassAllocation: Array<{
    name: string;
    assetClass: string;
    value: number;
    invested: number;
    gain: number;
    gainPct: number;
    percentage: number;
    color: string;
  }>;
  brokerAllocation: Array<{
    broker: string;
    accountName: string;
    value: number;
    percentage: number;
  }>;
  topGainers: Array<{
    id: string;
    symbol: string;
    name: string;
    assetClass: string;
    currentValue: number;
    unrealizedGain: number;
    gainPct: number;
  }>;
  concentrationAlerts: Array<{
    symbol: string;
    name: string;
    weightPct: number;
    type: "CRITICAL" | "WARNING" | "INFO";
    message: string;
  }>;
}

export async function getPortfolioSummary(selectedMemberId?: string): Promise<PortfolioSummary> {
  const memberFilter = selectedMemberId && selectedMemberId !== "ALL"
    ? { familyMemberId: selectedMemberId }
    : {};

  const accounts = await prisma.account.findMany({
    where: memberFilter,
    include: {
      familyMember: true,
      holdings: {
        include: {
          transactions: true,
        },
      },
      transactions: true,
    },
  });

  const allMembers = await prisma.familyMember.findMany({
    include: {
      accounts: {
        include: {
          holdings: true,
        },
      },
    },
  });

  let totalNetWorth = 0;
  let totalInvested = 0;
  let monthlyRentalIncome = 0;
  let annualDividendIncome = 0;
  let realizedGains = 0;

  const assetClassMap: Record<
    string,
    { value: number; invested: number; count: number }
  > = {
    EQUITY: { value: 0, invested: 0, count: 0 },
    MUTUAL_FUND: { value: 0, invested: 0, count: 0 },
    COMMODITY: { value: 0, invested: 0, count: 0 },
    REAL_ESTATE: { value: 0, invested: 0, count: 0 },
    FIXED_INCOME: { value: 0, invested: 0, count: 0 },
    CASH: { value: 0, invested: 0, count: 0 },
  };

  const brokerMap: Record<string, number> = {};
  const allHoldingsList: any[] = [];
  const allCashFlows: CashFlow[] = [];

  for (const acc of accounts) {
    let accTotal = 0;

    for (const h of acc.holdings) {
      const curVal = h.quantity * h.currentPrice;
      const invVal = h.quantity * h.avgBuyPrice;
      const unGain = curVal - invVal;
      const unGainPct = invVal > 0 ? (unGain / invVal) * 100 : 0;

      totalNetWorth += curVal;
      totalInvested += invVal;
      accTotal += curVal;

      if (!assetClassMap[h.assetClass]) {
        assetClassMap[h.assetClass] = { value: 0, invested: 0, count: 0 };
      }
      assetClassMap[h.assetClass].value += curVal;
      assetClassMap[h.assetClass].invested += invVal;
      assetClassMap[h.assetClass].count += 1;

      // Real estate metadata (rental income, mortgages)
      if (h.assetClass === "REAL_ESTATE" && h.metadata) {
        try {
          const meta = JSON.parse(h.metadata);
          if (meta.monthlyRental) {
            monthlyRentalIncome += Number(meta.monthlyRental);
          }
        } catch {}
      }

      // Cash flows for holding's transactions
      for (const tx of h.transactions) {
        allCashFlows.push({
          date: new Date(tx.date),
          amount: tx.amount,
        });

        if (tx.type === "DIVIDEND" || tx.type === "INTEREST") {
          annualDividendIncome += Math.abs(tx.amount);
        } else if (tx.type === "SELL") {
          const cost = tx.quantity * h.avgBuyPrice;
          const sellVal = tx.quantity * tx.price;
          realizedGains += sellVal - cost;
        }
      }

      allHoldingsList.push({
        id: h.id,
        symbol: h.symbol,
        name: h.name,
        assetClass: h.assetClass,
        currentValue: curVal,
        unrealizedGain: unGain,
        gainPct: unGainPct,
        quantity: h.quantity,
        avgBuyPrice: h.avgBuyPrice,
        currentPrice: h.currentPrice,
      });
    }

    // Include the terminal portfolio value as a positive cash flow today for XIRR
    brokerMap[acc.broker] = (brokerMap[acc.broker] || 0) + accTotal;
  }

  // Add terminal value today for XIRR calculation
  if (totalNetWorth > 0) {
    allCashFlows.push({
      date: new Date(),
      amount: totalNetWorth,
    });
  }

  const portfolioXIRR = calculateXIRR(allCashFlows);
  const totalUnrealizedGain = totalNetWorth - totalInvested;
  const totalGainPct = totalInvested > 0 ? (totalUnrealizedGain / totalInvested) * 100 : 0;

  // Asset class allocation array
  const assetColors: Record<string, string> = {
    EQUITY: "#3b82f6", // Blue
    MUTUAL_FUND: "#10b981", // Emerald
    COMMODITY: "#f59e0b", // Amber/Gold
    REAL_ESTATE: "#8b5cf6", // Purple
    FIXED_INCOME: "#06b6d4", // Cyan
    CASH: "#64748b", // Slate
  };

  const assetNames: Record<string, string> = {
    EQUITY: "Direct Equities",
    MUTUAL_FUND: "Mutual Funds",
    COMMODITY: "Gold & Commodities",
    REAL_ESTATE: "Real Estate",
    FIXED_INCOME: "Fixed Deposits & Debt",
    CASH: "Cash & Savings",
  };

  const assetClassAllocation = Object.entries(assetClassMap)
    .filter(([_, data]) => data.value > 0)
    .map(([key, data]) => {
      const gain = data.value - data.invested;
      const gainPct = data.invested > 0 ? (gain / data.invested) * 100 : 0;
      return {
        assetClass: key,
        name: assetNames[key] || key,
        value: data.value,
        invested: data.invested,
        gain,
        gainPct,
        percentage: totalNetWorth > 0 ? (data.value / totalNetWorth) * 100 : 0,
        color: assetColors[key] || "#94a3b8",
      };
    })
    .sort((a, b) => b.value - a.value);

  // Broker allocation
  const brokerAllocation = Object.entries(brokerMap).map(([broker, val]) => ({
    broker,
    accountName: broker,
    value: val,
    percentage: totalNetWorth > 0 ? (val / totalNetWorth) * 100 : 0,
  })).sort((a, b) => b.value - a.value);

  // Member summaries
  const familyMembers = allMembers.map((m) => {
    let val = 0;
    for (const acc of m.accounts) {
      for (const h of acc.holdings) {
        val += h.quantity * h.currentPrice;
      }
    }
    return {
      id: m.id,
      name: m.name,
      relationship: m.relationship,
      avatarColor: m.avatarColor || "#10b981",
      accountCount: m.accounts.length,
      totalValue: val,
    };
  });

  // Top gainers
  const topGainers = [...allHoldingsList]
    .sort((a, b) => b.unrealizedGain - a.unrealizedGain)
    .slice(0, 5);

  // Concentration Alerts
  const concentrationAlerts: PortfolioSummary["concentrationAlerts"] = [];
  for (const h of allHoldingsList) {
    if (totalNetWorth > 0) {
      const weight = (h.currentValue / totalNetWorth) * 100;
      if (h.assetClass === "EQUITY" && weight > 12) {
        concentrationAlerts.push({
          symbol: h.symbol,
          name: h.name,
          weightPct: weight,
          type: "WARNING",
          message: `${h.name} makes up ${weight.toFixed(1)}% of your total net worth (Threshold: 10%). Consider rebalancing.`,
        });
      }
    }
  }

  // Real estate concentration check
  const reAllocation = assetClassAllocation.find((a) => a.assetClass === "REAL_ESTATE");
  if (reAllocation && reAllocation.percentage > 60) {
    concentrationAlerts.push({
      symbol: "REAL_ESTATE",
      name: "Real Estate Portfolio",
      weightPct: reAllocation.percentage,
      type: "INFO",
      message: `Real estate constitutes ${reAllocation.percentage.toFixed(1)}% of family net worth. Ensure liquid asset buffers remain adequate.`,
    });
  }

  return {
    totalNetWorth,
    totalInvested,
    totalUnrealizedGain,
    totalGainPct,
    realizedGains,
    annualDividendIncome,
    monthlyRentalIncome,
    portfolioXIRR,
    familyMembers,
    assetClassAllocation,
    brokerAllocation,
    topGainers,
    concentrationAlerts,
  };
}

export async function getHoldingsList(params?: {
  memberId?: string;
  assetClass?: string;
  broker?: string;
  search?: string;
}) {
  const whereClause: any = {};

  if (params?.memberId && params.memberId !== "ALL") {
    whereClause.account = { familyMemberId: params.memberId };
  }

  if (params?.broker && params.broker !== "ALL") {
    whereClause.account = {
      ...(whereClause.account || {}),
      broker: params.broker,
    };
  }

  if (params?.assetClass && params.assetClass !== "ALL") {
    whereClause.assetClass = params.assetClass;
  }

  if (params?.search && params.search.trim()) {
    const s = params.search.trim();
    whereClause.OR = [
      { symbol: { contains: s } },
      { name: { contains: s } },
      { sector: { contains: s } },
    ];
  }

  const holdings = await prisma.holding.findMany({
    where: whereClause,
    include: {
      account: {
        include: {
          familyMember: true,
        },
      },
      transactions: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return holdings.map((h) => {
    const curVal = h.quantity * h.currentPrice;
    const invVal = h.quantity * h.avgBuyPrice;
    const unGain = curVal - invVal;
    const unGainPct = invVal > 0 ? (unGain / invVal) * 100 : 0;

    // Calculate individual holding XIRR
    const flows: CashFlow[] = h.transactions.map((tx) => ({
      date: new Date(tx.date),
      amount: tx.amount,
    }));
    if (curVal > 0) {
      flows.push({
        date: new Date(),
        amount: curVal,
      });
    }
    const xirr = calculateXIRR(flows);

    return {
      id: h.id,
      symbol: h.symbol,
      name: h.name,
      isin: h.isin,
      assetClass: h.assetClass,
      subCategory: h.subCategory,
      quantity: h.quantity,
      avgBuyPrice: h.avgBuyPrice,
      currentPrice: h.currentPrice,
      lastPriceUpdate: h.lastPriceUpdate,
      sector: h.sector,
      notes: h.notes,
      metadata: h.metadata,
      currentValue: curVal,
      investedValue: invVal,
      unrealizedGain: unGain,
      gainPct: unGainPct,
      xirr,
      accountName: h.account.name,
      broker: h.account.broker,
      familyMemberName: h.account.familyMember.name,
      familyMemberColor: h.account.familyMember.avatarColor,
      transactionCount: h.transactions.length,
    };
  });
}

export async function addHolding(data: {
  accountId: string;
  symbol: string;
  name: string;
  isin?: string;
  assetClass: string;
  subCategory?: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  sector?: string;
  notes?: string;
  metadata?: string;
  initialBuyDate?: string;
}) {
  const cleanSymbol = data.symbol.toUpperCase().trim().replace(/\s+/g, "");
  const qty = Number(data.quantity);
  const buyPrice = Number(data.avgBuyPrice);
  const curPrice = Number(data.currentPrice || buyPrice);

  // GUARDRAIL 1: Quantities and buy prices must be positive
  if (qty <= 0) {
    throw new Error("Quantity must be greater than 0.");
  }
  if (buyPrice <= 0) {
    throw new Error("Average buy price must be greater than ₹0.");
  }

  // GUARDRAIL 2: Check if this symbol already exists in this account
  // If it exists, calculate the new weighted-average cost basis instead of creating a duplicate row!
  const existing = await prisma.holding.findFirst({
    where: {
      accountId: data.accountId,
      symbol: cleanSymbol,
    },
  });

  let holding;

  if (existing) {
    const existingCost = existing.quantity * existing.avgBuyPrice;
    const newAdditionCost = qty * buyPrice;
    const totalQty = existing.quantity + qty;
    const weightedAvgPrice = (existingCost + newAdditionCost) / totalQty;

    holding = await prisma.holding.update({
      where: { id: existing.id },
      data: {
        quantity: totalQty,
        avgBuyPrice: weightedAvgPrice,
        currentPrice: curPrice,
        lastPriceUpdate: new Date(),
        notes: `${existing.notes || ""} | Added ${qty} @ ₹${buyPrice}`.trim(),
      },
    });
  } else {
    holding = await prisma.holding.create({
      data: {
        accountId: data.accountId,
        symbol: cleanSymbol,
        name: data.name.trim(),
        isin: data.isin?.trim(),
        assetClass: data.assetClass,
        subCategory: data.subCategory,
        quantity: qty,
        avgBuyPrice: buyPrice,
        currentPrice: curPrice,
        sector: data.sector,
        notes: data.notes,
        metadata: data.metadata,
      },
    });
  }

  // Create purchase transaction in ledger for XIRR & Capital Gains
  await prisma.transaction.create({
    data: {
      accountId: data.accountId,
      holdingId: holding.id,
      type: "BUY",
      date: data.initialBuyDate ? new Date(data.initialBuyDate) : new Date(),
      quantity: qty,
      price: buyPrice,
      amount: -qty * buyPrice,
      notes: existing ? "Additional accumulation buy" : "Initial purchase entry",
    },
  });

  revalidatePath("/");
  revalidatePath("/holdings");
  revalidatePath("/tax");
  return holding;
}

export async function sellHolding(data: {
  holdingId: string;
  quantityToSell: number;
  sellPrice: number;
  sellDate: string;
  notes?: string;
}) {
  const holding = await prisma.holding.findUnique({
    where: { id: data.holdingId },
    include: { account: true },
  });

  if (!holding) {
    throw new Error("Holding not found.");
  }

  const sellQty = Number(data.quantityToSell);
  const sellPrice = Number(data.sellPrice);

  // GUARDRAIL 1: Cannot sell non-positive quantities
  if (sellQty <= 0) {
    throw new Error("Sale quantity must be greater than 0.");
  }

  // GUARDRAIL 2: OVERSOLD PREVENTION (Cannot sell more shares than currently owned)
  if (sellQty > holding.quantity) {
    throw new Error(
      `Oversold Error: You cannot sell ${sellQty} units. You currently own only ${holding.quantity} units of ${holding.symbol} in this account.`
    );
  }

  // GUARDRAIL 3: Valid sale price
  if (sellPrice <= 0) {
    throw new Error("Sale price must be greater than ₹0.");
  }

  const costOfSoldShares = sellQty * holding.avgBuyPrice;
  const totalSaleProceeds = sellQty * sellPrice;
  const realizedGain = totalSaleProceeds - costOfSoldShares;

  // Record the SELL transaction for realized capital gains & XIRR cash inflow
  await prisma.transaction.create({
    data: {
      accountId: holding.accountId,
      holdingId: holding.id,
      type: "SELL",
      date: data.sellDate ? new Date(data.sellDate) : new Date(),
      quantity: sellQty,
      price: sellPrice,
      amount: totalSaleProceeds, // Positive cash inflow
      notes:
        data.notes ||
        `Realized Gain: ${realizedGain >= 0 ? "+" : ""}${realizedGain.toFixed(
          2
        )} on ${holding.symbol}`,
    },
  });

  // Update remaining holding quantity
  const remainingQty = holding.quantity - sellQty;

  if (remainingQty <= 0.0001) {
    // 100% position fully exited -> delete the holding from active table
    await prisma.holding.delete({
      where: { id: holding.id },
    });
  } else {
    // Partial sale: reduce quantity (cost basis per share remains identical)
    await prisma.holding.update({
      where: { id: holding.id },
      data: {
        quantity: remainingQty,
        lastPriceUpdate: new Date(),
      },
    });
  }

  try {
    revalidatePath("/");
    revalidatePath("/holdings");
    revalidatePath("/tax");
    revalidatePath("/analytics");
  } catch {}

  return {
    success: true,
    realizedGain,
    remainingQty,
  };
}

export async function updateHolding(
  id: string,
  data: {
    quantity?: number;
    avgBuyPrice?: number;
    currentPrice?: number;
    notes?: string;
    metadata?: string;
    subCategory?: string;
    sector?: string;
  }
) {
  const updated = await prisma.holding.update({
    where: { id },
    data: {
      ...(data.quantity !== undefined ? { quantity: Number(data.quantity) } : {}),
      ...(data.avgBuyPrice !== undefined ? { avgBuyPrice: Number(data.avgBuyPrice) } : {}),
      ...(data.currentPrice !== undefined ? { currentPrice: Number(data.currentPrice), lastPriceUpdate: new Date() } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
      ...(data.subCategory !== undefined ? { subCategory: data.subCategory } : {}),
      ...(data.sector !== undefined ? { sector: data.sector } : {}),
    },
  });

  revalidatePath("/");
  revalidatePath("/holdings");
  return updated;
}

export async function deleteHolding(id: string) {
  await prisma.holding.delete({
    where: { id },
  });
  revalidatePath("/");
  revalidatePath("/holdings");
  return { success: true };
}

export async function importStatementData(formData: {
  accountId: string;
  csvContent: string;
  fileName: string;
}) {
  const { accountId, csvContent, fileName } = formData;
  const parseResult = parseStatementCSV(csvContent);

  if (parseResult.errors.length > 0 && parseResult.holdings.length === 0) {
    await prisma.importLog.create({
      data: {
        fileName,
        broker: parseResult.detectedBroker,
        status: "FAILED",
        recordCount: 0,
        accountId,
        errorMessage: parseResult.errors.join("; "),
      },
    });
    return {
      success: false,
      message: parseResult.errors.join("; "),
      count: 0,
    };
  }

  let importedCount = 0;
  for (const h of parseResult.holdings) {
    // Check if holding exists in this account
    const existing = await prisma.holding.findFirst({
      where: {
        accountId,
        symbol: h.symbol,
      },
    });

    if (existing) {
      // Update quantity and prices
      await prisma.holding.update({
        where: { id: existing.id },
        data: {
          quantity: h.quantity,
          avgBuyPrice: h.avgBuyPrice,
          currentPrice: h.currentPrice,
          lastPriceUpdate: new Date(),
          ...(h.isin ? { isin: h.isin } : {}),
          ...(h.subCategory ? { subCategory: h.subCategory } : {}),
        },
      });
    } else {
      const created = await prisma.holding.create({
        data: {
          accountId,
          symbol: h.symbol,
          name: h.name,
          isin: h.isin,
          assetClass: h.assetClass,
          subCategory: h.subCategory,
          quantity: h.quantity,
          avgBuyPrice: h.avgBuyPrice,
          currentPrice: h.currentPrice,
          sector: h.sector,
          notes: h.notes,
          metadata: h.metadata ? JSON.stringify(h.metadata) : undefined,
        },
      });

      // Add a buy transaction representing the imported position
      if (h.quantity > 0 && h.avgBuyPrice > 0) {
        await prisma.transaction.create({
          data: {
            accountId,
            holdingId: created.id,
            type: "BUY",
            date: new Date(),
            quantity: h.quantity,
            price: h.avgBuyPrice,
            amount: -h.quantity * h.avgBuyPrice,
            notes: `Imported via ${parseResult.detectedBroker} statement`,
          },
        });
      }
    }
    importedCount++;
  }

  await prisma.importLog.create({
    data: {
      fileName,
      broker: parseResult.detectedBroker,
      status: "SUCCESS",
      recordCount: importedCount,
      accountId,
    },
  });

  revalidatePath("/");
  revalidatePath("/holdings");
  revalidatePath("/import-export");

  return {
    success: true,
    detectedBroker: parseResult.detectedBroker,
    count: importedCount,
  };
}

export async function applyCorporateAction(data: {
  holdingId: string;
  actionType: "SPLIT" | "BONUS" | "DIVIDEND";
  ratioNumerator?: number; // e.g. 10 (for 1:10 split) or 1 (for 1:1 bonus)
  ratioDenominator?: number; // e.g. 1 (for 1:10 split)
  dividendPerShare?: number; // e.g. 28.5
  recordDate?: string;
  notes?: string;
}) {
  const holding = await prisma.holding.findUnique({
    where: { id: data.holdingId },
  });

  if (!holding) {
    throw new Error("Holding not found.");
  }

  const num = data.ratioNumerator || 1;
  const den = data.ratioDenominator || 1;

  if (data.actionType === "SPLIT") {
    // Stock Split e.g. 1:10: 1 old share becomes 10 new shares
    // Ratio = num / den (e.g. 10 / 1 = 10x multiplier)
    const multiplier = num / den;
    const newQty = holding.quantity * multiplier;
    const newAvgPrice = holding.avgBuyPrice / multiplier;
    const newCurrentPrice = holding.currentPrice / multiplier;

    await prisma.holding.update({
      where: { id: holding.id },
      data: {
        quantity: newQty,
        avgBuyPrice: newAvgPrice,
        currentPrice: newCurrentPrice,
        notes: `${holding.notes || ""} | Applied ${num}:${den} Split on ${
          data.recordDate || new Date().toISOString().split("T")[0]
        }`.trim(),
      },
    });

    await prisma.transaction.create({
      data: {
        accountId: holding.accountId,
        holdingId: holding.id,
        type: "SPLIT",
        date: data.recordDate ? new Date(data.recordDate) : new Date(),
        quantity: newQty - holding.quantity,
        price: 0,
        amount: 0,
        notes: `Stock Split ${num}:${den} applied`,
      },
    });
  } else if (data.actionType === "BONUS") {
    // Bonus Issue e.g. 1:1 bonus gives 1 extra share for every 1 held
    // Bonus Qty = quantity * (num / den)
    const bonusShares = holding.quantity * (num / den);
    const newTotalQty = holding.quantity + bonusShares;
    const totalInvested = holding.quantity * holding.avgBuyPrice;
    const newAvgPrice = totalInvested / newTotalQty;

    await prisma.holding.update({
      where: { id: holding.id },
      data: {
        quantity: newTotalQty,
        avgBuyPrice: newAvgPrice,
        notes: `${holding.notes || ""} | Applied ${num}:${den} Bonus on ${
          data.recordDate || new Date().toISOString().split("T")[0]
        }`.trim(),
      },
    });

    await prisma.transaction.create({
      data: {
        accountId: holding.accountId,
        holdingId: holding.id,
        type: "BONUS",
        date: data.recordDate ? new Date(data.recordDate) : new Date(),
        quantity: bonusShares,
        price: 0,
        amount: 0,
        notes: `Bonus Issue ${num}:${den}: +${bonusShares} shares @ ₹0 cost`,
      },
    });
  } else if (data.actionType === "DIVIDEND") {
    // Dividend Cash Payout
    const dividendRate = Number(data.dividendPerShare) || 0;
    const totalPayout = holding.quantity * dividendRate;

    await prisma.transaction.create({
      data: {
        accountId: holding.accountId,
        holdingId: holding.id,
        type: "DIVIDEND",
        date: data.recordDate ? new Date(data.recordDate) : new Date(),
        quantity: holding.quantity,
        price: dividendRate,
        amount: totalPayout,
        notes: data.notes || `Dividend payout @ ₹${dividendRate}/share`,
      },
    });
  }

  try {
    revalidatePath("/");
    revalidatePath("/holdings");
    revalidatePath("/analytics");
  } catch {}

  return { success: true };
}

export async function getNotificationsAndActivity(memberId?: string) {
  const memberFilter =
    memberId && memberId !== "ALL"
      ? { account: { familyMemberId: memberId } }
      : {};

  // 1. Fetch Corporate Actions & Cashflow Transactions (Dividends, Splits, Bonuses, Rent, Interest)
  const transactions = await prisma.transaction.findMany({
    where: {
      type: {
        in: ["DIVIDEND", "SPLIT", "BONUS", "INTEREST", "RENT"],
      },
      ...memberFilter,
    },
    include: {
      holding: true,
      account: {
        include: {
          familyMember: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
    take: 40,
  });

  // 2. Fetch Holdings to scan for upcoming maturities & real estate leases
  const holdings = await prisma.holding.findMany({
    where: memberFilter,
    include: {
      account: {
        include: { familyMember: true },
      },
    },
  });

  const upcomingMilestones: Array<{
    id: string;
    title: string;
    symbol: string;
    entityName: string;
    date: string;
    type: "SGB_COUPON" | "FD_MATURITY" | "LEASE_EXPIRY";
    detail: string;
    amount?: string;
  }> = [];

  for (const h of holdings) {
    if (h.metadata) {
      try {
        const meta = JSON.parse(h.metadata);
        if (meta.maturityDate) {
          upcomingMilestones.push({
            id: `mat-${h.id}`,
            title: `${h.name} Maturity`,
            symbol: h.symbol,
            entityName: h.account.familyMember.name,
            date: meta.maturityDate,
            type: h.assetClass === "COMMODITY" ? "SGB_COUPON" : "FD_MATURITY",
            detail:
              h.assetClass === "COMMODITY"
                ? `8-Year RBI SGB Redemption (100% Tax-Exempt Capital Gain)`
                : `Fixed Deposit Maturity @ ${meta.interestRate || 7.5}% interest`,
            amount:
              h.assetClass === "COMMODITY"
                ? `${h.quantity} Grams Spot Gold Rate`
                : undefined,
          });
        }
        if (meta.leaseExpiry) {
          upcomingMilestones.push({
            id: `lease-${h.id}`,
            title: `${h.name} Tenant Lease Expiry`,
            symbol: h.symbol,
            entityName: h.account.familyMember.name,
            date: meta.leaseExpiry,
            type: "LEASE_EXPIRY",
            detail: `Tenant: ${meta.tenantName || "Institutional"} | Monthly Rent: ₹${(
              meta.monthlyRental || 0
            ).toLocaleString("en-IN")}`,
          });
        }
      } catch {}
    }
  }

  // 3. Concentration & Rebalancing Alerts
  const summary = await getPortfolioSummary(memberId);
  const alerts = summary.concentrationAlerts;

  return {
    activity: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      date: t.date,
      title:
        t.type === "DIVIDEND"
          ? `Dividend Credit: ${t.holding?.symbol || "Stock"}`
          : t.type === "SPLIT"
          ? `Stock Split Applied: ${t.holding?.symbol || "Stock"}`
          : t.type === "BONUS"
          ? `Bonus Shares Credited: ${t.holding?.symbol || "Stock"}`
          : t.type === "RENT"
          ? `Rental Income Received: ${t.holding?.name || "Property"}`
          : `Interest Credited: ${t.holding?.symbol || "Asset"}`,
      symbol: t.holding?.symbol || "",
      holdingName: t.holding?.name || "",
      amount: t.amount,
      quantity: t.quantity,
      price: t.price,
      notes: t.notes,
      accountName: t.account.name,
      broker: t.account.broker,
      memberName: t.account.familyMember.name,
      memberColor: t.account.familyMember.avatarColor,
    })),
    upcomingMilestones,
    alerts,
  };
}

export async function getAccountsWithMembers() {
  return await prisma.familyMember.findMany({
    include: {
      accounts: {
        include: {
          holdings: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function createFamilyMember(data: {
  name: string;
  relationship: string;
  pan?: string;
  avatarColor?: string;
  targetEquityPct?: number;
  targetDebtPct?: number;
  targetGoldPct?: number;
  targetRealEstatePct?: number;
}) {
  const member = await prisma.familyMember.create({
    data: {
      name: data.name,
      relationship: data.relationship,
      pan: data.pan,
      avatarColor: data.avatarColor || "#10b981",
      targetEquityPct: data.targetEquityPct || 50,
      targetDebtPct: data.targetDebtPct || 20,
      targetGoldPct: data.targetGoldPct || 15,
      targetRealEstatePct: data.targetRealEstatePct || 15,
    },
  });
  revalidatePath("/accounts");
  return member;
}

export async function createAccount(data: {
  familyMemberId: string;
  name: string;
  broker: string;
  accountType: string;
  accountNumber?: string;
}) {
  const account = await prisma.account.create({
    data,
  });
  revalidatePath("/accounts");
  return account;
}

export async function getTaxCalculationData(memberId?: string) {
  const memberFilter = memberId && memberId !== "ALL"
    ? { account: { familyMemberId: memberId } }
    : {};

  // Find all SELL transactions to calculate realized capital gains
  const sellTransactions = await prisma.transaction.findMany({
    where: {
      type: "SELL",
      ...memberFilter,
    },
    include: {
      holding: true,
      account: {
        include: {
          familyMember: true,
        },
      },
    },
  });

  // Also include unrealized lots for simulated tax harvesting
  const holdings = await prisma.holding.findMany({
    where: memberFilter,
    include: {
      transactions: {
        where: { type: "BUY" },
        orderBy: { date: "asc" },
      },
      account: {
        include: { familyMember: true },
      },
    },
  });

  const realizedLots = sellTransactions.map((tx) => {
    const buyPrice = tx.holding ? tx.holding.avgBuyPrice : tx.price;
    const buyDate = tx.holding?.createdAt || new Date(tx.date.getTime() - 400 * 24 * 60 * 60 * 1000);
    return evaluateTaxLot({
      id: tx.id,
      holdingName: tx.holding?.name || "Sold Holding",
      symbol: tx.holding?.symbol || "SOLD",
      assetClass: tx.holding?.assetClass || "EQUITY",
      buyDate,
      sellDate: new Date(tx.date),
      quantity: tx.quantity,
      buyPrice,
      sellPrice: tx.price,
    });
  });

  // Simulated tax harvesting lots (unrealized gains if sold today)
  const unrealizedLots = holdings.map((h) => {
    const earliestBuy = h.transactions[0]?.date || h.createdAt;
    return evaluateTaxLot({
      id: h.id,
      holdingName: h.name,
      symbol: h.symbol,
      assetClass: h.assetClass,
      buyDate: new Date(earliestBuy),
      sellDate: new Date(),
      quantity: h.quantity,
      buyPrice: h.avgBuyPrice,
      sellPrice: h.currentPrice,
    });
  });

  const realizedReport = compileTaxReport(realizedLots, "FY 2024-25 Realized");
  const unrealizedReport = compileTaxReport(unrealizedLots, "FY 2024-25 Unrealized (Harvesting Opportunity)");

  return {
    realizedReport,
    unrealizedReport,
  };
}

export async function syncMarketPrices() {
  const holdings = await prisma.holding.findMany({
    where: {
      assetClass: {
        in: ["EQUITY", "MUTUAL_FUND", "COMMODITY"],
      },
    },
  });

  let updatedCount = 0;
  const updates: Array<{ symbol: string; oldPrice: number; newPrice: number; source: string }> = [];

  for (const h of holdings) {
    let quote = null;

    if (h.assetClass === "EQUITY" || h.assetClass === "COMMODITY") {
      quote = await fetchStockQuote(h.symbol);
      await delay(600); // Pace requests to respect rate limits
    } else if (h.assetClass === "MUTUAL_FUND") {
      let amfiCode = "";
      if (h.metadata) {
        try {
          const meta = JSON.parse(h.metadata);
          amfiCode = meta.amfiCode || "";
        } catch {}
      }
      if (amfiCode) {
        quote = await fetchMutualFundNAV(amfiCode);
      }
      // If no amfiCode, try symbol or ticker
      if (!quote) {
        quote = await fetchStockQuote(h.symbol);
      }
    }

    if (quote && quote.price > 0 && Math.abs(quote.price - h.currentPrice) > 0.001) {
      await prisma.holding.update({
        where: { id: h.id },
        data: {
          currentPrice: quote.price,
          lastPriceUpdate: new Date(),
        },
      });

      updates.push({
        symbol: h.symbol,
        oldPrice: h.currentPrice,
        newPrice: quote.price,
        source: quote.source,
      });
      updatedCount++;
    }
  }

  try {
    revalidatePath("/");
    revalidatePath("/holdings");
    revalidatePath("/analytics");
  } catch {}

  return {
    success: true,
    totalScanned: holdings.length,
    updatedCount,
    updates,
  };
}
