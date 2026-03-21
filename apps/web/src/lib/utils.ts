import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a stat value: integers stay whole, floats show one decimal place. */
export function formatStat(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

