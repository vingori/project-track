/**
 * Extended Internal Rate of Return (XIRR) Engine
 * Uses Newton-Raphson numerical algorithm with bisection fallback.
 */

export interface CashFlow {
  date: Date;
  amount: number; // Negative for investments (cash out), positive for returns/current value (cash in)
}

export function calculateXIRR(cashFlows: CashFlow[], guess: number = 0.1): number | null {
  if (!cashFlows || cashFlows.length < 2) return null;

  // Filter out zero amount flows and sort by date ascending
  const sorted = [...cashFlows]
    .filter((cf) => Math.abs(cf.amount) > 0.0001)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (sorted.length < 2) return null;

  // Check that there is at least one positive and one negative cash flow
  const hasNegative = sorted.some((cf) => cf.amount < 0);
  const hasPositive = sorted.some((cf) => cf.amount > 0);
  if (!hasNegative || !hasPositive) return null;

  const d0 = sorted[0].date.getTime();
  const dayFractions = sorted.map((cf) => (cf.date.getTime() - d0) / (1000 * 60 * 60 * 24 * 365));

  const maxIterations = 100;
  const tolerance = 1e-6;
  let rate = guess;

  // Newton-Raphson
  for (let i = 0; i < maxIterations; i++) {
    // Avoid non-positive base: rate cannot be <= -1
    if (rate <= -0.999) {
      rate = -0.99;
    }

    let npv = 0;
    let dNpv = 0;

    for (let j = 0; j < sorted.length; j++) {
      const t = dayFractions[j];
      const cf = sorted[j].amount;
      const factor = Math.pow(1 + rate, t);

      npv += cf / factor;
      if (t !== 0) {
        dNpv -= (t * cf) / (factor * (1 + rate));
      }
    }

    if (Math.abs(npv) < tolerance) {
      return rate * 100; // Return percentage e.g. 15.42%
    }

    if (Math.abs(dNpv) < 1e-10) {
      // Derivative too flat, nudge rate
      rate += 0.05;
      continue;
    }

    const nextRate = rate - npv / dNpv;

    // Guard against extreme jumps
    if (isNaN(nextRate) || !isFinite(nextRate) || nextRate < -0.99 || nextRate > 20) {
      // Fallback to bisection
      return bisectionXIRR(sorted, dayFractions);
    }

    if (Math.abs(nextRate - rate) < tolerance) {
      return nextRate * 100;
    }

    rate = nextRate;
  }

  // If Newton-Raphson failed to converge, try bisection
  return bisectionXIRR(sorted, dayFractions);
}

function bisectionXIRR(sorted: CashFlow[], dayFractions: number[]): number | null {
  let low = -0.99;
  let high = 5.0; // 500% max
  const tolerance = 1e-5;

  const calcNpv = (r: number) => {
    let npv = 0;
    for (let j = 0; j < sorted.length; j++) {
      npv += sorted[j].amount / Math.pow(1 + r, dayFractions[j]);
    }
    return npv;
  };

  let npvLow = calcNpv(low);
  let npvHigh = calcNpv(high);

  if (npvLow * npvHigh > 0) {
    // Both same sign, expand search or return simple return
    return null;
  }

  for (let i = 0; i < 80; i++) {
    const mid = (low + high) / 2;
    const npvMid = calcNpv(mid);

    if (Math.abs(npvMid) < tolerance || (high - low) / 2 < tolerance) {
      return mid * 100;
    }

    if (npvMid * npvLow > 0) {
      low = mid;
      npvLow = npvMid;
    } else {
      high = mid;
      npvHigh = npvMid;
    }
  }

  return ((low + high) / 2) * 100;
}
