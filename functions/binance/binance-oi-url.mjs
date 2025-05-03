export function binanceOiUrl(symbol, interval, limit) {
  const baseUrl = "https://fapi.binance.com/futures/data/openInterestHist";
  return `${baseUrl}?symbol=${symbol}&period=${interval}&limit=${limit}`;
}
