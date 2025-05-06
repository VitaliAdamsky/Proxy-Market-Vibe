export const getIntervalDurationMs = (tf) => {
  const timeframes = {
    "1m": 59999,
    "5m": 299999,
    "15m": 899999,
    "30m": 1799999,
    "1h": 3599999,
    "2h": 7199999,
    "4h": 14399999,
    "6h": 21599999,
    "8h": 28799999,
    "12h": 43199999,
    D: 86399999,
  };

  if (!(tf in timeframes)) {
    throw new Error(`Unsupported timeframe: ${tf}`);
  }

  return timeframes[tf];
};
