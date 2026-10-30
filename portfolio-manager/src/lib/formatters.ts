/**
 * Indian Rupee (INR) and Financial Formatters
 */

export function formatINR(
  amount: number,
  options: {
    compact?: boolean;
    showSign?: boolean;
    decimals?: number;
  } = {}
): string {
  const { compact = false, showSign = false, decimals = 2 } = options;

  if (isNaN(amount) || amount === null || amount === undefined) {
    return "₹0.00";
  }

  const sign = amount < 0 ? "-" : showSign && amount > 0 ? "+" : "";
  const absAmount = Math.abs(amount);

  if (compact) {
    if (absAmount >= 10000000) {
      // 1 Crore = 10,000,000
      const cr = absAmount / 10000000;
      return `${sign}₹${cr.toFixed(decimals)} Cr`;
    } else if (absAmount >= 100000) {
      // 1 Lakh = 100,000
      const lk = absAmount / 100000;
      return `${sign}₹${lk.toFixed(decimals)} L`;
    } else if (absAmount >= 1000) {
      const k = absAmount / 1000;
      return `${sign}₹${k.toFixed(1)} K`;
    } else {
      return `${sign}₹${absAmount.toFixed(decimals)}`;
    }
  }

  // Full Indian comma separation: 12,34,56,789.00
  const parts = absAmount.toFixed(decimals).split(".");
  let intPart = parts[0];
  const decPart = parts.length > 1 ? `.${parts[1]}` : "";

  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== "") {
    lastThree = "," + lastThree;
  }
  const formattedInt =
    otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

  return `${sign}₹${formattedInt}${decPart}`;
}

export function formatPercent(
  value: number,
  options: { showSign?: boolean; decimals?: number } = {}
): string {
  const { showSign = true, decimals = 2 } = options;
  if (isNaN(value) || value === null || value === undefined) {
    return "0.00%";
  }
  const sign = value > 0 && showSign ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatDate(date: string | Date): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(date);
  }
}
