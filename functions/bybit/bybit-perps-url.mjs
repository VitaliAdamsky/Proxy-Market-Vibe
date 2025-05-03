export function bybitPerpUrl(symbol, interval, limit) {
  const baseUrl = "https://api.bybit.com/v5/market/kline";
  return `${baseUrl}?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit}`;
}
