export function bybitSpotUrl(symbol, interval, limit) {
  const baseUrl = "https://api.bybit.com/v5/market/kline";
  return `${baseUrl}?category=spot&symbol=${symbol}&interval=${interval}&limit=${limit}`;
}
