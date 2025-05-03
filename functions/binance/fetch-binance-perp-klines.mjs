import { getBinanceKlineInterval } from "./get-binance-kline-interval.mjs";
import { binancePerpsUrl } from "./binance-perps-url.mjs";

export const fetchBinancePerpKlines = async (coins, timeframe, limit) => {
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

      const url = binancePerpsUrl(coin.symbol, binanceInterval, limit);

      const response = await fetch(url, { headers });
      const responseData = await response.json();

      if (!Array.isArray(responseData)) {
        console.error(
          `Invalid response structure for ${coin.symbol}:`,
          responseData
        );
        throw new Error(`Invalid response structure for ${coin.symbol}`);
      }

      const data = responseData.map((entry) => {
        // Calculate buyer ratio and delta volume
        const baseVolume = parseFloat(entry[5]);
        const takerBuyBase = parseFloat(entry[9]);
        const takerBuyQuote = parseFloat(entry[10]);
        const totalQuoteVolume = parseFloat(entry[7]);

        // Buyer ratio calculation (taker buys vs total volume)
        const buyerRatio =
          baseVolume > 0
            ? Math.round((takerBuyBase / baseVolume) * 100 * 100) / 100 // Rounds to 2 decimals
            : 0;

        // Delta volume calculation (buyer USDT - seller USDT)
        const sellerQuoteVolume = totalQuoteVolume - takerBuyQuote;
        const deltaVolume = takerBuyQuote - sellerQuoteVolume;

        return {
          symbol: coin.symbol,
          openTime: parseFloat(entry[0]),
          closeTime: parseFloat(entry[6]),
          openPrice: parseFloat(entry[1]),
          highPrice: parseFloat(entry[2]),
          lowPrice: parseFloat(entry[3]),
          closePrice: parseFloat(entry[4]),
          baseVolume: baseVolume,
          quoteVolume: totalQuoteVolume,
          buyerRatio: buyerRatio, // Added: 51.09 (example)
          deltaVolume: deltaVolume,
        };
      });

      return { symbol: coin.symbol, data };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { symbol: coin.symbol, data: [] };
    }
  });

  return Promise.all(promises);
};
