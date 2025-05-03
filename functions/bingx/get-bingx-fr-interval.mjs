export const getBingXFrInterval = (timeframe) => {
  const timeframes = {
    m1: "1m",
    m5: "5m",
    m15: "15m",
    m30: "30m",
    h1: "1h",
    h2: "2h",
    h4: "4h",
    h6: "6h",
    h8: "8h",
    h12: "12h",
    D: "D",
  };

  if (!(timeframe in timeframes)) {
    throw new Error(`Unsupported timeframe: ${timeframe}`);
  }

  return timeframes[timeframe];
};
