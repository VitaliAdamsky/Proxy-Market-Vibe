export function addFrData(klines, frData) {
  const fundingMap = frData.reduce((map, fr) => {
    const symbol = fr.symbol.toUpperCase().replace("-", "");
    if (!map.has(symbol)) map.set(symbol, []);
    fr.data.forEach((entry) => {
      map.get(symbol).push({
        openTime: entry.openTime,
        closeTime: entry.closeTime,
        fundingRate: entry.fundingRate,
        fundingRateChange: entry.fundingRateChange,
      });
    });
    return map;
  }, new Map());

  const processed = klines.map((klineGroup) => ({
    ...klineGroup,
    data: klineGroup.data.map((kline) => {
      const symbol = klineGroup.symbol.toUpperCase().replace("-", "");
      const adjustedTime = kline.openTime + 300000; // +5 minutes
      const rates = fundingMap.get(symbol) || [];

      let foundFundingRate = null;
      let foundFundingRateChange = null;
      for (const rateEntry of rates) {
        if (
          adjustedTime > rateEntry.openTime &&
          adjustedTime < rateEntry.closeTime
        ) {
          foundFundingRate = rateEntry.fundingRate;
          foundFundingRateChange = rateEntry.fundingRateChange;
          break;
        }
      }

      return {
        ...kline,
        fundingRate: foundFundingRate,
        fundingRateChange: foundFundingRateChange,
      };
    }),
  }));

  return processed;
}
