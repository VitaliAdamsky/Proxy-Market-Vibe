export function binanceOiUrl(symbol, interval, limit) {
  const base = "https://fapi.binance.com/futures/data/openInterestHist";

  return `${base}?symbol=${symbol}&period=${interval}&limit=${limit}`;
}
