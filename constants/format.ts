/**
 * Formatting utilities for Chandra Mall (Hong Kong & Indonesia cross-border)
 */

export function formatPrice(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === "") return "HK$ 0";
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) return "HK$ 0";
  
  // Display standard HKD format (e.g., HK$ 45 or HK$ 120.50 if has cents)
  const hasDecimals = num % 1 !== 0;
  const formatted = num.toLocaleString("en-HK", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `HK$ ${formatted}`;
}

export function formatCurrencyShort(amount: number | string): string {
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) return "HK$ 0";
  return `HK$ ${num.toLocaleString("en-HK")}`;
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export function formatRating(rating: number | string | undefined | null): string {
  const num = typeof rating === "number" ? rating : parseFloat(String(rating || 0));
  return isNaN(num) ? "0.0" : num.toFixed(1);
}
