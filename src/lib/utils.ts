import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeRemaining(targetDate: Date | string | null | undefined): {
  text: string;
  isBreached: boolean;
  isWarning: boolean;
} {
  if (!targetDate) return { text: "No SLA", isBreached: false, isWarning: false };
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0) {
    const minsOver = Math.abs(Math.round(diffMs / 60000));
    return {
      text: `Breached by ${minsOver}m`,
      isBreached: true,
      isWarning: false,
    };
  }

  const minsLeft = Math.round(diffMs / 60000);
  const hoursLeft = Math.floor(minsLeft / 60);
  const remMins = minsLeft % 60;

  if (hoursLeft < 1) {
    return {
      text: `${minsLeft}m left`,
      isBreached: false,
      isWarning: true,
    };
  }

  return {
    text: `${hoursLeft}h ${remMins}m left`,
    isBreached: false,
    isWarning: hoursLeft <= 2,
  };
}
