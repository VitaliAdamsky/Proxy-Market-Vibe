import { bingXOiUrl } from "./bingx-oi-url.mjs";

export const fetchBingXOi = async (coins) => {
  const promises = coins.map(async (coin) => {
    try {
      const url = bingXOiUrl(coin.symbol);
      const response = await fetch(url);
      const data = await response.json();

      // if (!data?.data || !Array.isArray(data.data)) {
      //   console.error(`Invalid response structure for ${coin.symbol}:`, data);
      //   throw new Error(`Invalid response structure for ${coin.symbol}`);
      // }
      const klineData = {
        openTime: Number(data.data.time),
        symbol: coin.symbol,
        imageUrl: coin.imageUrl,
        category: coin.category || "unknown",
        exchanges: coin.exchanges || [],
        openInterest: Number(data.data.openInterest),
      };

      return { symbol: coin.symbol, klineData };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { symbol: coin.symbol, klineData: [] };
    }
  });

  return Promise.all(promises);
};
