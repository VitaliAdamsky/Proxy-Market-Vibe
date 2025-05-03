export const getBybitOiInterval = (timeframe) => {
  const timeframes = {
    m5: "5min",
    m15: "15min",
    m30: "30min",
    h1: "1h",
    h4: "4h",
    D: "1d",
  };

  if (!(timeframe in timeframes)) {
    throw new Error(`Unsupported timeframe: ${timeframe}`);
  }

  return timeframes[timeframe];
};

//5min,15min,30min,1h,4h,1d
