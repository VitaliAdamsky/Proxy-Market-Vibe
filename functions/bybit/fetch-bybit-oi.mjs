import { getBybitOiInterval } from "./get-bybit-oi-interval.mjs";
import { bybitOiUrl } from "./bybit-oi-url.mjs";

export const fetchBybitOi = async (coins, timeframe, limit) => {
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
      const data = rawEntries
        .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
        .map((entry, index, arr) => {
          const currentValue = Number(entry.openInterest);

          // Calculate OI change from previous entry
          const openInterestChange =
            index > 0
              ? Number(
                  (
                    ((currentValue - Number(arr[index - 1].openInterest)) /
                      Math.abs(Number(arr[index - 1].openInterest))) *
                    100
                  ).toFixed(2)
                )
              : null;

          return {
            symbol: coin.symbol,
            openTime: Number(entry.timestamp),
            openInterest: Number(currentValue.toFixed(2)),
            openInterestChange,
          };
        });

      const cleanedData = data.slice(1, -1);

      return {
        symbol: coin.symbol,
        exchanges: coin.exchanges,
        imageUrl: coin.imageUrl,
        category: coin.category,
        data: cleanedData,
      };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { symbol: coin.symbol, data: [] };
    }
  });

  return Promise.all(promises);
};
