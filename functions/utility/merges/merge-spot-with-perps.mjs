import { calcChange } from "../calculate-change.mjs";

export function mergeSpotWithPerps(perps, spot) {
  // 1. Создаём карту спотовых данных по символу и openTime
  const spotMap = new Map();

  for (const { symbol, data } of spot) {
    const timeMap = new Map();
    for (const entry of data) {
      timeMap.set(entry.openTime, entry.closePrice);
    }
    spotMap.set(symbol, timeMap);
  }

  // 2. Обрабатываем PERP-данные, сохраняя все поля (exchanges, imageUrl, category)
  return perps.map((perp) => {
    const { symbol, data, ...rest } = perp; // Сохраняем все поля, кроме symbol и data
    const spotData = spotMap.get(symbol) || new Map();
    let prevEntry = null;

    // Обрабатываем каждую запись PERP
    const processedData = data.map((currentEntry) => {
      // Вычисляем изменения между текущей и предыдущей записью
      const changes = {
        quoteVolumeChange: calcChange(
          currentEntry.quoteVolume,
          prevEntry?.quoteVolume
        ),
        volumeDeltaChange: calcChange(
          currentEntry.volumeDelta,
          prevEntry?.volumeDelta
        ),
        closePriceChange: calcChange(
          currentEntry.closePrice,
          prevEntry?.closePrice
        ),
        buyerRatioChange: calcChange(
          currentEntry.buyerRatio,
          prevEntry?.buyerRatio
        ),
      };

      // Получаем спотовую цену, если доступна
      const spotPrice = spotData.get(currentEntry.openTime);
      const spotMetrics = spotPrice
        ? {
            spotClosePrice: spotPrice,
            perpSpotDiff: calcChange(currentEntry.closePrice, spotPrice),
          }
        : {};

      prevEntry = currentEntry;

      // Возвращаем объединённые данные
      return {
        ...currentEntry,
        ...changes,
        ...spotMetrics,
      };
    });

    // Удаляем первый элемент из массива (где изменения = null)
    const finalData = processedData.slice(1);

    // Возвращаем объект с обработанными данными
    return {
      symbol,
      ...rest,
      data: finalData,
    };
  });
}
