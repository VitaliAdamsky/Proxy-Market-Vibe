import { bybitFrUrl } from "./bybit-fr-url.mjs";

export const fetchBybitFr = async (coins, limit) => {
  const promises = coins.map(async (coin) => {
    try {
      const url = bybitFrUrl(coin.symbol, limit);

      const response = await fetch(url);
      const responseData = await response.json();

      // ✅ Fix: Correct response structure validation
      if (
        !responseData?.result?.list ||
        !Array.isArray(responseData.result.list)
      ) {
        console.error(
          `Invalid response structure for ${coin.symbol}:`,
          responseData
        );
        throw new Error(`Invalid response structure for ${coin.symbol}`);
      }

      const rawEntries = data.result.list;
      const data = rawEntries.map((entry) => ({
        openTime: Number(entry.fundingRateTimestamp),
        symbol: coin.symbol,
        imageUrl: coin.imageUrl,
        category: coin.category || "unknown",
        exchanges: coin.exchanges || [],
        fundingRate: Number(entry.fundingRate),
      }));
      klineData.reverse();
      // klineData.pop();
      return { symbol: coin.symbol, data };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { symbol: coin.symbol, data: [] };
    }
  });

  return Promise.all(promises);
};
