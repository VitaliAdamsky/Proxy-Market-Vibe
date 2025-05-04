import { bingXFrUrl } from "./bingx-fr-url.mjs";

export const fetchBingXFr = async (coins, limit) => {
  const promises = coins.map(async (coin) => {
    try {
      const url = bingXFrUrl(coin.symbol, limit);
      const response = await fetch(url);
      const responseData = await response.json();

      if (!responseData?.data || !Array.isArray(responseData.data)) {
        console.error(`Invalid response for ${coin.symbol}:`, responseData);
        throw new Error(`Invalid response for ${coin.symbol}`);
      }

      // Sort entries chronologically
      const rawEntries = responseData.data
        .map((entry) => ({
          ...entry,
          fundingTime: Number(entry.fundingTime),
        }))
        .sort((a, b) => a.fundingTime - b.fundingTime);

      // Calculate actual interval from data
      const baseInterval =
        rawEntries.length >= 2
          ? rawEntries[1].fundingTime - rawEntries[0].fundingTime
          : 8 * 3600 * 1000;

      const data = rawEntries.map((entry, index, arr) => {
        const currentOpenTime = entry.fundingTime;
        const currentRate = Number(entry.fundingRate);

        // Calculate closeTime using consistent interval
        const closeTime = currentOpenTime + baseInterval - 1;

        // Validate time sequence
        if (closeTime <= currentOpenTime) {
          throw new Error(
            `Invalid closeTime for ${coin.symbol} at ${currentOpenTime}`
          );
        }

        // Calculate rate change from next entry (chronological order)
        const fundingRateChange =
          index < arr.length - 1
            ? ((arr[index + 1].fundingRate - currentRate) /
                Math.abs(currentRate)) *
              100
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
