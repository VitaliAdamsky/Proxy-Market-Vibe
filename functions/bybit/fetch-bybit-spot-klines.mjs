import { getBybitKlineInterval } from "./get-bybit-kline-interval.mjs";
import { bybitSpotUrl } from "./bybit-spot-url.mjs";

export const fetchBybitSpotKlines = async (coins, timeframe, limit) => {
  const bybitInterval = getBybitKlineInterval(timeframe);

  const promises = coins.map(async (coin) => {
    try {
      const url = bybitSpotUrl(coin.symbol, bybitInterval, limit);

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching ${coin.symbol}:`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      if (
        !responseData?.result?.list ||
        !Array.isArray(responseData.result.list)
      ) {
        console.error(`Invalid response structure for ${coin.symbol}:`, data);
        throw new Error(`Invalid response structure for ${coin.symbol}`);
      }

      const rawEntries = responseData.result.list.sort((a, b) => a[0] - b[0]);

      const data = [];

      for (const entry of rawEntries) {
        if (!Array.isArray(entry) || entry.length < 7) continue;

        data.push({
          symbol: coin.symbol,
          openTime: Number(entry[0]),
          closePrice: Number(entry[4]),
        });
      }

      const cleanedData = data.slice(0, -1);
      return {
        symbol: coin.symbol,
        category: coin.category || "unknown",
        exchanges: coin.exchanges || [],
        imageUrl: coin.imageUrl || "assets/img/noname.png",
        data: cleanedData,
      };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { symbol: coin.symbol, data: [] };
    }
  });

  return Promise.all(promises);
};
