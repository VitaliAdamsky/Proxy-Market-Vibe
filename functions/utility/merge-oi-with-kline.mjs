export function mergeOiWithKline(klineData, oiData) {
  // Шаг 1: Создаём карту OI данных по символу и openTime
  const oiMapBySymbol = new Map();

  for (const coin of oiData) {
    const oiMapByTime = new Map();
    for (const entry of coin.data) {
      oiMapByTime.set(entry.openTime, {
        openInterest: entry.openInterest,
        openInterestChange: entry.openInterestChange,
      });
    }
    oiMapBySymbol.set(coin.symbol, oiMapByTime);
  }

  // Шаг 2: Объединяем данные
  return klineData.map((klineCoin) => {
    const oiMap = oiMapBySymbol.get(klineCoin.symbol) || new Map();

    const mergedData = klineCoin.data.map((klineEntry) => {
      const oiEntry = oiMap.get(klineEntry.openTime);

      return {
        ...klineEntry,
        openInterest: oiEntry?.openInterest ?? null,
        openInterestChange: oiEntry?.openInterestChange ?? null,
      };
    });

    return {
      ...klineCoin,
      data: mergedData,
    };
  });
}
