import { bybitFrUrl } from "./bybit-fr-url.mjs";

export const fetchBybitFr = async (coins, limit) => {
  const promises = coins.map(async (coin) => {
    try {
      const url = bybitFrUrl(coin.symbol, limit);
      const response = await fetch(url);
      const responseData = await response.json();

      if (
        !responseData?.result?.list ||
        !Array.isArray(responseData.result.list)
      ) {
        console.error(`Invalid response for ${coin.symbol}:`, responseData);
        throw new Error(`Invalid response for ${coin.symbol}`);
      }

      // Sort entries chronologically (oldest first)
      const rawEntries = responseData.result.list
        .map((entry) => ({
          ...entry,
          fundingRateTimestamp: Number(entry.fundingRateTimestamp),
        }))
        .sort((a, b) => a.fundingRateTimestamp - b.fundingRateTimestamp);

      // Calculate actual interval from sorted data
      const baseInterval =
        rawEntries.length >= 2
          ? rawEntries[1].fundingRateTimestamp -
            rawEntries[0].fundingRateTimestamp
          : 8 * 3600 * 1000;

      const data = rawEntries.map((entry, index, arr) => {
        const currentOpenTime = entry.fundingRateTimestamp;
        const currentRate = Number(entry.fundingRate);

        // Calculate closeTime using consistent interval
        const closeTime = currentOpenTime + baseInterval - 1;

        // Validate time sequence
        if (closeTime <= currentOpenTime) {
          throw new Error(
            `Invalid closeTime for ${coin.symbol} at ${currentOpenTime}`
          );
        }

        // Calculate forward-looking rate change
        const fundingRateChange =
          index < arr.length - 1
            ? Number(
                (
                  ((arr[index + 1].fundingRate - currentRate) /
                    Math.abs(currentRate)) *
                  100
                ).toFixed(2)
              )
            : null;

        return {
          openTime: currentOpenTime,
          closeTime,
          symbol: coin.symbol,
          fundingRate: currentRate,
          fundingRateChange,
        };
      });

      return { symbol: coin.symbol, data };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { symbol: coin.symbol, data: [] };
    }
  });

  return Promise.all(promises);
};
