import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Philippine Peso.
 * formatPrice(350) → "₱350"
 * formatPrice(1000) → "₱1,000"
 */
export function formatPrice(amount: number): string {
  return `₱${amount.toLocaleString("en-PH")}`;
}
