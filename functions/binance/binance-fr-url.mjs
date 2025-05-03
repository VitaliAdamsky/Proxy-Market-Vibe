export function binanceFrUrl(symbol, limit) {
  const baseUrl = "https://fapi.binance.com/fapi/v1/fundingRate";
  return `${baseUrl}?symbol=${symbol}&limit=${limit}`;
}
