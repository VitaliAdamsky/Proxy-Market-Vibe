import { getBinanceKlineInterval } from "./get-binance-kline-interval.mjs";
import { binanceOiUrl } from "./binance-oi-url.mjs";

export const fetchBinanceOi = async (coins, timeframe, limit) => {
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

      const url = binanceOiUrl(coin.symbol, binanceInterval, limit);

      const response = await fetch(url, { headers });
      const responseData = await response.json();

      if (!Array.isArray(responseData)) {
        console.error(
          `Invalid response structure for ${coin.symbol}:`,
          responseData
        );
        throw new Error(`Invalid response structure for ${coin.symbol}`);
      }

      const data = responseData.map((entry: any) => ({
        openTime: Number(entry.timestamp),
        symbol: coin.symbol,
        openInterest: Number(entry.sumOpenInterestValue),
      }));

      return { symbol: coin.symbol, data };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { symbol: coin.symbol, data: [] };
    }
  });

  return Promise.all(promises);
};
