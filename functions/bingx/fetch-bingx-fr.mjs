import { bingXFrUrl } from "./bingx-fr-url.mjs";

export const fetchBingXFr = async (coins, limit) => {
  const promises = coins.map(async (coin) => {
    try {
      const url = bingXFrUrl(coin.symbol, limit);
      const response = await fetch(url);
      const data = await response.json();

      if (!data?.data || !Array.isArray(data.data)) {
        console.error(`Invalid response structure for ${coin.symbol}:`, data);
        throw new Error(`Invalid response structure for ${coin.symbol}`);
      }

      const klineData = data.data.map((entry) => ({
        openTime: Number(entry.fundingTime),
        symbol: coin.symbol,
        imageUrl: coin.imageUrl,
        category: coin.category || "unknown",
        exchanges: coin.exchanges || [],
        fundingRate: Number(entry.fundingRate),
      }));

      return { symbol: coin.symbol, klineData };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { symbol: coin.symbol, klineData: [] };
    }
  });

  return Promise.all(promises);
};
