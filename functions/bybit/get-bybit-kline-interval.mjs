export const getBybitKlineInterval = (timeframe) => {
  const timeframes = {
    m1: "1",
    m5: "5",
    m15: "15",
    m30: "30",
    h1: "60",
    h2: "120",
    h4: "240",
    h6: "360",
    h8: "480",
    h12: "720",
    D: "D",
  };

  if (!(timeframe in timeframes)) {
    throw new Error(`Unsupported timeframe: ${timeframe}`);
  }

  return timeframes[timeframe];
};
