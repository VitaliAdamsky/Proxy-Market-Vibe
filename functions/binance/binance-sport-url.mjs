export function binanceSpotUrl(symbol, interval, limit) {
  const baseUrl = "https://api.binance.com/api/v3/klines";
  return `${baseUrl}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
}
