export const getIntervalDurationMs = (tf) => {
  const timeframes = {
    m1: 59999,
    m5: 299999,
    m15: 899999,
    m30: 1799999,
    h1: 3599999,
    h2: 7199999,
    h4: 14399999,
    h6: 21599999,
    h8: 28799999,
    h12: 43199999,
    D: 86399999,
  };

  if (!(tf in timeframes)) {
    throw new Error(`Unsupported timeframe: ${tf}`);
  }

  return timeframes[tf];
};
