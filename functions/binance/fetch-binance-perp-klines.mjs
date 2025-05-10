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
        .map((entry) => {
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
          const sellerQuoteVolume = (totalQuoteVolume - takerBuyQuote).toFixed(
            2
          );
          const volumeDelta = (takerBuyQuote - sellerQuoteVolume).toFixed(2);

          return {
            openTime: parseFloat(entry[0]),
            closeTime: parseFloat(entry[6]),
            closePrice: parseFloat(entry[4]),
            quoteVolume: parseFloat(totalQuoteVolume),
            buyerRatio: parseFloat(buyerRatio),
            volumeDelta: parseFloat(volumeDelta),
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
