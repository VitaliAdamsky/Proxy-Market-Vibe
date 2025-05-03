import { getIntervalDurationMs } from "../get-interval-duration-ms.mjs";
import { getBybitOiInterval } from "./get-bybit-oi-interval.mjs";
import { bybitOiUrl } from "./bybit-oi-url.mjs";
import { calculateCloseTime } from "../calculate-close-time.mjs";

export const fetchBybitOi = async (coins, timeframe, limit) => {
  const intervalMs = getIntervalDurationMs(timeframe);
  const bybitInterval = getBybitOiInterval(timeframe);

  const promises = coins.map(async (coin) => {
    try {
      const url = bybitOiUrl(coin.symbol, bybitInterval, limit);

      const response = await fetch(url);
      const data = await response.json();

      if (!data?.result?.list || !Array.isArray(data.result.list)) {
        console.error(`Invalid response structure for ${coin.symbol}:`, data);
        throw new Error(`Invalid response structure for ${coin.symbol}`);
      }

      const rawEntries = data.result.list;
      const klineData = rawEntries.map((entry) => ({
        openTime: Number(entry.timestamp),
        closeTime: calculateCloseTime(entry.timestamp, intervalMs), // Make sure intervalMs is correct
        symbol: coin.symbol,
        imageUrl: coin.imageUrl,
        category: coin.category || "unknown",
        exchanges: coin.exchanges || [],
        openInterest: Number(entry.openInterest),
      }));

      klineData.reverse();
      klineData.pop();

      return { symbol: coin.symbol, klineData };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { symbol: coin.symbol, klineData: [] };
    }
  });

  return Promise.all(promises);
};
