import { getIntervalDurationMs } from "../get-interval-duration-ms.mjs";
import { getBybitKlineInterval } from "./get-bybit-kline-interval.mjs";
import { bybitPerpUrl } from "./bybit-perps-url.mjs";
import { calculateCloseTime } from "../calculate-close-time.mjs";

export const fetchBybitPerpKlines = async (coins, timeframe, limit) => {
  const intervalMs = getIntervalDurationMs(timeframe);
  const bybitInterval = getBybitKlineInterval(timeframe);

  const promises = coins.map(async (coin) => {
    try {
      const url = bybitPerpUrl(coin.symbol, bybitInterval, limit);

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
      const data = [];

      for (const entry of rawEntries) {
        if (!Array.isArray(entry) || entry.length < 7) continue;

        data.push({
          openTime: Number(entry[0]),
          closeTime: calculateCloseTime(Number(entry[0]), intervalMs),
          symbol: coin.symbol,
          category: coin.category || "unknown",
          exchanges: coin.exchanges || [],
          imageUrl: coin.imageUrl || "assets/img/noname.png",
          // openPrice: Number(entry[1]),
          // highPrice: Number(entry[2]),
          // lowPrice: Number(entry[3]),
          closePrice: Number(entry[4]),
          //baseVolume: Number(entry[5]),
          quoteVolume: Number(entry[6]),
        });
      }

      return { symbol: coin.symbol, data };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { symbol: coin.symbol, data: [] };
    }
  });

  return Promise.all(promises);
};
