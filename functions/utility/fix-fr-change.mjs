/**
 * Исправляет `fundingRateChange` на `0%`, если `fundingRate` не изменился.
 * @param {Array} data - Обработанные данные с `fundingRate` и `fundingRateChange`.
 * @returns {Array} - Исправленные данные.
 */
export function fixFrChange(data) {
  return data.map((coin) => {
    const { symbol, data: entries } = coin;

    // Обрабатываем каждую запись
    const fixedEntries = entries.map((entry, index, arr) => {
      // Пропускаем первую запись
      if (index === 0) return entry;

      const prevEntry = arr[index - 1];
      const currentFr = entry.fundingRate;
      const prevFr = prevEntry.fundingRate;

      // Защита от NaN и null
      if (typeof currentFr !== "number" || typeof prevFr !== "number") {
        return entry; // Не меняем, если значения некорректны
      }

      // Проверяем, изменился ли `fundingRate` (с учётом точности)
      const frDidNotChange = Math.abs(currentFr - prevFr) < 1e-8;

      // Если не изменился → устанавливаем `fundingRateChange = 0`
      if (frDidNotChange) {
        return {
          ...entry,
          fundingRateChange: 0,
        };
      }

      return entry;
    });

    return {
      ...coin,
      data: fixedEntries,
    };
  });
}
