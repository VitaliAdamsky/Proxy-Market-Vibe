export const getBybitOiInterval = (timeframe) => {
  const timeframes = {
    "5m": "5min",
    "15m": "15min",
    "30m": "30min",
    "1h": "1h",
    "4h": "4h",
    "6h": "6h",
    "8h": "8h",
    "12h": "12h",
    D: "1d",
  };

  if (!(timeframe in timeframes)) {
    throw new Error(`Unsupported timeframe: ${timeframe}`);
  }

  return timeframes[timeframe];
};

//5min,15min,30min,1h,4h,1d
