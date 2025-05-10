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

      // Сортировка по времени
      const sortedData = responseData.sort(
        (a, b) => Number(a.timestamp) - Number(b.timestamp)
      );

      // Обработка данных
      const data = sortedData.map((entry, index, arr) => {
        const currentValue = Number(entry.sumOpenInterestValue);

        // Вычисление изменения OI
        let openInterestChange = null;

        if (index > 0) {
          const prevValue = Number(arr[index - 1].sumOpenInterestValue);

          if (prevValue !== 0) {
            openInterestChange = Number(
              (
                ((currentValue - prevValue) / Math.abs(prevValue)) *
                100
              ).toFixed(2)
            );
          } else {
            openInterestChange = currentValue !== 0 ? 100 : 0;
          }
        }

        return {
          openTime: Number(entry.timestamp),
          symbol: coin.symbol,
          openInterest: Number(currentValue.toFixed(2)),
          openInterestChange,
        };
      });

      // Удаляем только первый элемент (где openInterestChange = null)
      const cleanedData = data.slice(1, -1);

      // Возвращаем полный объект с защитой от отсутствия полей
      return {
        symbol: coin.symbol,
        exchanges: coin.exchanges || [],
        imageUrl: coin.imageUrl || "",
        category: coin.category || "",
        data: cleanedData,
      };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { symbol: coin.symbol, data: [] };
    }
  });

  return Promise.all(promises);
};
