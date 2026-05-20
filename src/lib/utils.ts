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

/**
 * Format integer centavos as Philippine Peso.
 * Whole-peso amounts render without decimals; fractional pesos render 2 dp.
 * formatCentavos(25000) → "₱250"
 * formatCentavos(25050) → "₱250.50"
 * formatCentavos(0)     → "₱0"
 */
export function formatCentavos(centavos: number): string {
  const pesos = centavos / 100;
  const hasFraction = centavos % 100 !== 0;
  return `₱${pesos.toLocaleString("en-PH", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
