import { getColorFromChangeValue } from "../utility/colors/get-color-from-change-value.mjs";
import { getColorFromValue } from "../utility/colors/get-color-from-value.mjs";

export function normalizeOpenInterestData(marketDataArray) {
  return marketDataArray.map((coinData) => {
    const { data } = coinData;

    // Skip if no data
    if (!data?.length) return coinData;

    // Extract values for normalization
    const openInterests = data.map((item) => item.openInterest ?? 0);
    const openInterestChanges = data.map(
      (item) => item.openInterestChange ?? 0
    );

    const oiMin = Math.min(...openInterests);
    const oiMax = Math.max(...openInterests);
    const oiRange = oiMax - oiMin || 1; // prevent division by 0

    const oiChangeMin = Math.min(...openInterestChanges);
    const oiChangeMax = Math.max(...openInterestChanges);

    const updatedData = data.map((item) => {
      const normalizedOi = (item.openInterest - oiMin) / oiRange;
      const oiColor = getColorFromValue(normalizedOi);
      const oiChangeColor = getColorFromChangeValue(
        item.openInterestChange,
        oiChangeMin,
        oiChangeMax
      );

      return {
        ...item,
        colors: {
          ...item.colors,
          openInterest: oiColor,
          openInterestChange: oiChangeColor,
        },
      };
    });

    return {
      ...coinData,
      data: updatedData,
    };
  });
}
