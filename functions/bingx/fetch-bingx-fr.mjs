import { bingXFrUrl } from "./bingx-fr-url.mjs";

import { calcChange } from "../utility/calculate-change.mjs";

export const fetchBingXFr = async (coins, limit) => {
  const promises = coins.map(async (coin) => {
    try {
      const url = bingXFrUrl(coin.symbol, limit);
      const response = await fetch(url);
      const responseData = await response.json();

      if (!responseData?.data || !Array.isArray(responseData.data)) {
        console.error(`Invalid response for ${coin.symbol}:`, responseData);
        throw new Error(`Invalid response for ${coin.symbol}`);
      }

      // Извлечение и нормализация данных
      const rawEntries = responseData.data
        .map((entry) => ({
          fundingTime: Number(entry.fundingTime),
          fundingRate: Number(entry.fundingRate),
        }))
        .sort((a, b) => a.fundingTime - b.fundingTime); // Сортировка по возрастанию времени

      // Вычисление базового интервала
      const baseInterval =
        rawEntries.length >= 2
          ? rawEntries[1].fundingTime - rawEntries[0].fundingTime
          : 8 * 3600 * 1000;

      // Обработка данных
      const data = rawEntries.map((entry, index, arr) => {
        const currentOpenTime = entry.fundingTime;
        const currentRate = entry.fundingRate;
        const closeTime = currentOpenTime + baseInterval - 1;

        // Проверка временной последовательности
        if (closeTime <= currentOpenTime) {
          throw new Error(`Invalid timestamps for ${coin.symbol}`);
        }

        // Вычисление изменения fundingRate
        let fundingRateChange = null;
        if (index > 0) {
          const prevRate = arr[index - 1].fundingRate;
          fundingRateChange = calcChange(currentRate, prevRate);
        }

        return {
          openTime: currentOpenTime,
          closeTime,
          symbol: coin.symbol,
          fundingRate: currentRate,
          fundingRateChange,
        };
      });

      return {
        symbol: coin.symbol,
        exchanges: coin.exchanges || [],
        imageUrl: coin.imageUrl || "",
        category: coin.category || "",
        data,
      };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { symbol: coin.symbol, data: [] };
    }
  });

  return Promise.all(promises);
};
