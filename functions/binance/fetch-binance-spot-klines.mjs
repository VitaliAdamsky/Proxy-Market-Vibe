import { getBinanceKlineInterval } from "./get-binance-kline-interval.mjs";
import { binanceSpotUrl } from "./binance-sport-url.mjs";

export const fetchBinanceSpotKlines = async (coins, timeframe, limit) => {
  const binanceInterval = getBinanceKlineInterval(timeframe);

  const promises = coins.map(async (coin) => {
    try {
      // Configure headers for Binance
      const headers = new Headers();
      headers.set(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
      );
      headers.set("Accept", "*/*");
      headers.set("Accept-Language", "en-US,en;q=0.9");
      headers.set("Origin", "https://www.binance.com");
      headers.set("Referer", "https://www.binance.com/");

      const url = binanceSpotUrl(coin.symbol, binanceInterval, limit);

      const response = await fetch(url, { headers });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching ${coin.symbol}:`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseData = await response.json();

      if (!Array.isArray(responseData)) {
        console.error(
          `Invalid response structure for ${coin.symbol}:`,
          responseData
        );
        throw new Error(`Invalid response structure for ${coin.symbol}`);
      }

      const data = responseData
        .sort((a, b) => a[0] - b[0])
        .map((entry) => ({
          symbol: coin.symbol,
          openTime: parseFloat(entry[0]),
          closePrice: parseFloat(entry[4]),
        }));

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
