// Helper function to calculate price difference
export function calculatePriceDiff(perpPrice, spotPrice) {
  if (!perpPrice || !spotPrice || spotPrice === 0) return null;
  return Number((((perpPrice - spotPrice) / spotPrice) * 100).toFixed(3));
}
