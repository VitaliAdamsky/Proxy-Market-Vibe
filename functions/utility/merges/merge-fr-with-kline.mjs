import { calcChange } from "../calculate-change.mjs";

/**
 * Добавляет `fundingRate` и `fundingRateChange` к `kline`-данным.
 * @param {Array} klines - Массив данных с kline (4H/6H и т.д.).
 * @param {Array} frData - Массив данных с fundingRate (4H/8H и т.д.).
 * @returns {Array} - Обработанные данные с корректными `fundingRate` и `fundingRateChange`.
 */
export function mergeFrWithKline(klines, frData) {
  // 1. Создаём карту `fundingRate` по символу
  const frMap = new Map();

  for (const fr of frData) {
    const entries = [...fr.data]
      .map((entry) => ({
        openTime: Number(entry.openTime),
        closeTime: Number(entry.closeTime),
        fundingRate: Number(entry.fundingRate),
      }))
      .sort((a, b) => a.openTime - b.openTime); // Убедитесь, что данные упорядочены по времени

    frMap.set(fr.symbol, entries);
  }

  // 2. Обрабатываем kline-данные
  return klines.map((klineGroup) => {
    const { symbol, data } = klineGroup;
    const frEntries = frMap.get(symbol) || [];

    let lastValidFrIndex = 0;

    const processedData = data.map((kline) => {
      // Ищем актуальный fundingRate
      while (
        lastValidFrIndex < frEntries.length &&
        kline.openTime >= frEntries[lastValidFrIndex].closeTime
      ) {
        lastValidFrIndex++;
      }

      const currentFrEntry = frEntries[lastValidFrIndex];
      const fundingRate =
        currentFrEntry &&
        kline.openTime + 5 * 60 * 1000 >= currentFrEntry.openTime &&
        kline.openTime < currentFrEntry.closeTime
          ? currentFrEntry.fundingRate
          : null;

      // Рассчитываем fundingRateChange только при смене fundingRate
      let fundingRateChange = null;
      if (currentFrEntry && lastValidFrIndex > 0) {
        const prevFrEntry = frEntries[lastValidFrIndex - 1];
        if (prevFrEntry.fundingRate !== currentFrEntry.fundingRate) {
          fundingRateChange = calcChange(
            currentFrEntry.fundingRate,
            prevFrEntry.fundingRate
          );
        } else {
          fundingRateChange = 0; // Нет изменений
        }
      }

      return {
        ...kline,
        fundingRate,
        fundingRateChange,
      };
    });

    return {
      ...klineGroup,
      data: processedData,
    };
  });
}
