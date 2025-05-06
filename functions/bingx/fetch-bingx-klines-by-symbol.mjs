import { getIntervalDurationMs } from "../get-interval-duration-ms.mjs";
import { bingxPerpUrl } from "./bingx-perps-url";
import { calculateCloseTime } from "../calculate-close-time.mjs";
import { getBingXKlineInterval } from "./get-bingx-kline-interval.mjs";

export const fetchBingXKlinesBySymbol = async (coin, timeframe, limit) => {
  const intervalMs = getIntervalDurationMs(timeframe);
  const bingXInterval = getBingXKlineInterval(timeframe);

  try {
    const url = bingxPerpUrl(coin.symbol, bingXInterval, limit);

    const response = await fetch(url);
    const data = await response.json();

    if (!data?.data || !Array.isArray(data.data)) {
      console.error(`Invalid response structure for ${coin.symbol}:`, data);
      throw new Error(`Invalid response structure for ${coin.symbol}`);
    }

    const klineData = data.data
      .sort((a, b) => a["open"] - b["open"])
      .map((entry) => ({
        openTime: Number(entry.time),
        closeTime: calculateCloseTime(Number(entry.time), intervalMs),
        symbol: coin.symbol,
        category: coin.category || "unknown",
        exchanges: coin.exchanges || [],
        imageUrl: coin.imageUrl || "assets/img/noname.png",
        openPrice: Number(entry.open),
        highPrice: Number(entry.high),
        lowPrice: Number(entry.low),
        closePrice: Number(entry.close),
        baseVolume: Number(entry.volume),
        quoteVolume: Number(entry.volume * entry.close),
      }));

    klineData.reverse();
    klineData.pop(); // remove the last incomplete bar if needed

    return klineData;
  } catch (error) {
    console.error(`Error processing ${coin.symbol}:`, error);
    return [];
  }
};
