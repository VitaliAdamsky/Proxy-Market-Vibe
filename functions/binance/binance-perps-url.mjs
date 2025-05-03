export function binancePerpsUrl(symbol, interval, limit) {
  const baseUrl = "https://fapi.binance.com/fapi/v1/klines";
  return `${baseUrl}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
}
