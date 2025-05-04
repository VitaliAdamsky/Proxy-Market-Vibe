import { getIntervalDurationMs } from "../utility/get-interval-duration-ms.mjs";
import { getBybitOiInterval } from "./get-bybit-oi-interval.mjs";
import { bybitOiUrl } from "./bybit-oi-url.mjs";
import { calculateCloseTime } from "../utility/calculate-close-time.mjs";

export const fetchBybitOi = async (coins, timeframe, limit) => {
  const intervalMs = getIntervalDurationMs(timeframe);
  const bybitInterval = getBybitOiInterval(timeframe);

  const promises = coins.map(async (coin) => {
    try {
      const url = bybitOiUrl(coin.symbol, bybitInterval, limit);

      const response = await fetch(url);
      const responseData = await response.json();

      if (
        !responseData?.result?.list ||
        !Array.isArray(responseData.result.list)
      ) {
        console.error(`Invalid response structure for ${coin.symbol}:`, data);
        throw new Error(`Invalid response structure for ${coin.symbol}`);
      }

      const rawEntries = responseData.result.list;
      const data = rawEntries.map((entry) => ({
        symbol: coin.symbol,
        openTime: Number(entry.timestamp),
        openInterest: Number(entry.openInterest),
        // closeTime: calculateCloseTime(entry.timestamp, intervalMs), // Make sure intervalMs is correct
        // imageUrl: coin.imageUrl,
        // category: coin.category || "unknown",
        // exchanges: coin.exchanges || [],
      }));

      return { symbol: coin.symbol, data };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { symbol: coin.symbol, data: [] };
    }
  });

  return Promise.all(promises);
};
