import { getColorFromChangeValue } from "../utility/colors/get-color-from-change-value.mjs";
import { getColorFromValue } from "../utility/colors/get-color-from-value.mjs";

export function normalizeFundingRateData(marketDataArray) {
  return marketDataArray.map((coinData) => {
    const data = coinData.data;

    // Extract fundingRate and fundingRateChange arrays
    const fundingRates = data.map((item) => item.fundingRate ?? 0);
    const fundingRateChanges = data.map((item) => item.fundingRateChange ?? 0);

    const frMin = Math.min(...fundingRates);
    const frMax = Math.max(...fundingRates);
    const frRange = frMax - frMin;
    const frUniform = frRange === 0;

    const frChangeMin = Math.min(...fundingRateChanges);
    const frChangeMax = Math.max(...fundingRateChanges);

    const updatedData = data.map((item) => {
      const fundingRate = item.fundingRate ?? 0;
      const fundingRateChange = item.fundingRateChange ?? 0;

      const normalizedFr = frUniform ? 1 : (fundingRate - frMin) / frRange;

      const frColor = getColorFromValue(normalizedFr, "#0000ff", "#ffa500"); // blue → orange
      const frChangeColor = getColorFromChangeValue(
        fundingRateChange,
        frChangeMin,
        frChangeMax,
        "#ff4d4d",
        "#ffffff",
        "#4dff4d"
      );

      return {
        ...item,
        colors: {
          ...(item.colors || {}),
          fundingRate: frColor,
          fundingRateChange: frChangeColor,
        },
      };
    });

    return {
      ...coinData,
      data: updatedData,
    };
  });
}
