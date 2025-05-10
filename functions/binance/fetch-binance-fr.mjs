import { binanceFrUrl } from "./binance-fr-url.mjs";

export const fetchBinanceFr = async (coins, limit) => {
  const promises = coins.map(async (coin) => {
    try {
      const headers = new Headers();
      headers.set(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
      );
      headers.set("Accept", "*/*");
      headers.set("Accept-Language", "en-US,en;q=0.9");
      headers.set("Origin", "https://www.binance.com");
      headers.set("Referer", "https://www.binance.com/");

      const url = binanceFrUrl(coin.symbol, limit);
      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching ${coin.symbol}:`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseData = await response.json();

      if (!Array.isArray(responseData)) {
        console.error(`Invalid response for ${coin.symbol}:`, responseData);
        throw new Error(`Invalid response for ${coin.symbol}`);
      }

      // Извлечение и сортировка данных
      const rawEntries = responseData
        .map((entry) => ({
          fundingTime: Number(entry.fundingTime),
          fundingRate: Number(entry.fundingRate),
        }))
        .sort((a, b) => a.fundingTime - b.fundingTime); // Убедитесь, что время возрастает

      // Вычисляем базовый интервал между записями
      const baseInterval =
        rawEntries.length >= 2
          ? rawEntries[1].fundingTime - rawEntries[0].fundingTime
          : 8 * 3600 * 1000;

      // Обработка данных
      const data = rawEntries.map((entry, index, arr) => {
        const currentOpenTime = entry.fundingTime;
        const currentRate = Number(entry.fundingRate);
        const closeTime = currentOpenTime + baseInterval - 1;

        // Вычисление изменения fundingRate
        let fundingRateChange = null;

        if (index > 0) {
          const prevRate = arr[index - 1].fundingRate;

          if (prevRate !== 0) {
            // Стандартный % изменения: (текущий - предыдущий) / предыдущий * 100
            fundingRateChange = Number(
              (((currentRate - prevRate) / Math.abs(prevRate)) * 100).toFixed(2)
            );
          } else {
            // Если предыдущий = 0:
            if (currentRate > 0) fundingRateChange = 100; // Рост с 0 до +x%
            if (currentRate < 0) fundingRateChange = -100; // Падение с 0 до -x%
            if (currentRate === 0) fundingRateChange = 0; // Нет изменений
          }
        }

        return {
          openTime: currentOpenTime,
          closeTime,
          fundingRate: currentRate,
          fundingRateChange,
        };
      });

      return {
        symbol: coin.symbol,
        exchanges: coin.exchanges,
        imageUrl: coin.imageUrl,
        category: coin.category,
        data,
      };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { symbol: coin.symbol, data: [] };
    }
  });

  return Promise.all(promises);
};
