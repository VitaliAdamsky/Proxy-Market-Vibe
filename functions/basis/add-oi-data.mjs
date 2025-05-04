export function addOiData(klines, oiData) {
  // 1. Create OpenInterest lookup map
  const oiMap = oiData.reduce((map, fr) => {
    const symbol = fr.symbol.toUpperCase().replace("-", "");
    if (!map.has(symbol)) map.set(symbol, []);
    fr.data.forEach((entry) => {
      map.get(symbol).push({
        openTime: entry.openTime,
        openInterest: entry.openInterest,
        openInterestChange: entry.openInterestChange,
      });
    });
    return map;
  }, new Map());

  // 2. Merge data with direct lookup
  const processed = klines.map((klineGroup) => ({
    ...klineGroup,
    data: klineGroup.data.map((kline) => {
      const symbol = klineGroup.symbol.toUpperCase().replace("-", "");

      const rates = oiMap.get(symbol) || [];

      let foundOpenInterest = null;
      let foundOpenInterestChange = null;
      for (const rateEntry of rates) {
        if (kline.openTime === rateEntry.openTime) {
          foundOpenInterest = rateEntry.openInterest;
          foundOpenInterestChange = rateEntry.openInterestChange;
          break;
        }
      }

      return {
        ...kline,
        openInterest: foundOpenInterest,
        openInterestChange: foundOpenInterestChange,
      };
    }),
  }));

  return processed;
}
