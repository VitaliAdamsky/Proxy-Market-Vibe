/**
 * Группирует символы по интервалам (`4h`, `6h`, `8h`) на основе их funding rate данных.
 * @param {Array} data - Массив символов с `symbol`, `exchanges`, `imageUrl`, `category`, `data`.
 * @returns {{ "4h": Array, "6h": Array, "8h": Array }} - Символы, сгруппированные по интервалам.
 */
export function groupFrByInterval(data) {
  const intervals = {
    "1h": 1 * 3600 * 1000,
    "2h": 2 * 3600 * 1000,
    "4h": 4 * 3600 * 1000,
    "6h": 6 * 3600 * 1000,
    "8h": 8 * 3600 * 1000,
  };

  const grouped = {
    "1h": [],
    "2h": [],
    "4h": [],
    "6h": [],
    "8h": [],
  };

  // 1. Определяем тип интервала для символа
  function getIntervalKey(symbolData) {
    if (!Array.isArray(symbolData) || symbolData.length < 2) return null;

    const firstOpen = symbolData[0].openTime;
    const secondOpen = symbolData[1].openTime;

    const duration = secondOpen - firstOpen;

    for (const [key, ms] of Object.entries(intervals)) {
      if (Math.abs(duration - ms) <= 1000) {
        return key;
      }
    }

    return null;
  }

  // 2. Группируем символы
  for (const symbolEntry of data) {
    const { symbol, data: frEntries } = symbolEntry;

    // Пропускаем, если нет данных или интервал не определён
    if (!Array.isArray(frEntries) || frEntries.length === 0) continue;

    // Определяем интервал
    const intervalKey = getIntervalKey(frEntries);

    // Если интервал не определён → попробуем использовать данные о бирже
    if (!intervalKey && symbolEntry.exchanges?.includes("Binance")) {
      console.log(`Binance symbol ${symbol} with unknown interval`);
      // Binance → default 8h
      grouped["8h"].push(symbolEntry);
    } else if (!intervalKey && symbolEntry.exchanges?.includes("Bybit")) {
      console.log(`Bybit symbol ${symbol} with unknown interval`);
      // Bybit → default 4h
      grouped["4h"].push(symbolEntry);
    } else if (!intervalKey) {
      // Неизвестный источник → не группируем
      continue;
    } else {
      grouped[intervalKey].push(symbolEntry);
    }
  }

  return grouped;
}
