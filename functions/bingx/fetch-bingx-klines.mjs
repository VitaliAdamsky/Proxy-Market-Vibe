import { getIntervalDurationMs } from "../utility/get-interval-duration-ms.mjs";
import { bingxPerpUrl } from "./bingx-perps-url";
import { calculateCloseTime } from "../utility/calculate-close-time.mjs";
import { getBingXKlineInterval } from "./get-bingx-kline-interval.mjs";

export const fetchBingXKlines = async (coins, timeframe, limit) => {
  const intervalMs = getIntervalDurationMs(timeframe);
  const bingXInterval = getBingXKlineInterval(timeframe);

  const promises = coins.map(async (coin) => {
    try {
      const url = bingxPerpUrl(coin.symbol, bingXInterval, limit);

      const response = await fetch(url);
      const data = await response.json();

      // ✅ Fix: Check for correct response structure
      if (!data?.data || !Array.isArray(data.data)) {
        console.error(`Invalid response structure for ${coin.symbol}:`, data);
        throw new Error(`Invalid response structure for ${coin.symbol}`);
      }

      // ✅ Fix: Iterate over data.data directly (not data.data[0])
      const klineData = data.data.map((entry) => ({
        openTime: Number(entry.time),
        closeTime: calculateCloseTime(Number(entry.time), intervalMs),
        symbol: coin.symbol,
        category: coin.category || "unknown",
        exchanges: coin.exchanges || [],
        openPrice: Number(entry.open),
        imageUrl: coin.imageUrl || "assets/img/noname.png",
        highPrice: Number(entry.high),
        lowPrice: Number(entry.low),
        closePrice: Number(entry.close),
        baseVolume: Number(entry.volume),
        quoteVolume: Number(entry.volume * entry.close),
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
