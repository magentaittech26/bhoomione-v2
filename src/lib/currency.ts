/**
 * Reusable helper to format currency values to Indian Rupees (INR).
 * Uses Indian numbering format with lakh/crore groupings and 0 decimal places.
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
};
