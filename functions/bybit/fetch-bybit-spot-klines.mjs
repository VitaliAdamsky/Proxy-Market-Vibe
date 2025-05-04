import { getIntervalDurationMs } from "../utility/get-interval-duration-ms.mjs";
import { getBybitKlineInterval } from "./get-bybit-kline-interval.mjs";
import { bybitSpotUrl } from "./bybit-spot-url.mjs";
import { calculateCloseTime } from "../utility/calculate-close-time.mjs";

export const fetchBybitSpotKlines = async (coins, timeframe, limit) => {
  const intervalMs = getIntervalDurationMs(timeframe);
  const bybitInterval = getBybitKlineInterval(timeframe);

  const promises = coins.map(async (coin) => {
    try {
      const url = bybitSpotUrl(coin.symbol, bybitInterval, limit);

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
          symbol: coin.symbol,
          openTime: Number(entry[0]),
          closePrice: Number(entry[4]),
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
