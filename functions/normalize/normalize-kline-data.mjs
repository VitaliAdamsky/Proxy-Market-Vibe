import { getColorFromChangeValue } from "../utility/colors/get-color-from-change-value.mjs";
import { getColorFromValue } from "../utility/colors/get-color-from-value.mjs";

export function normalizeKlineData(marketDataArray) {
  return marketDataArray.map((coinData) => {
    const data = coinData.data;

    const closePrices = data.map((item) => item.closePrice ?? 0);
    const closePriceChanges = data.map((item) => item.closePriceChange ?? 0);
    const buyerRatios = data.map((item) => item.buyerRatio ?? 0);
    const buyerRatioChanges = data.map((item) => item.buyerRatioChange ?? 0);
    const quoteVolumes = data.map((item) => item.quoteVolume ?? 0);
    const quoteVolumeChanges = data.map((item) => item.quoteVolumeChange ?? 0);
    const spotPrices = data.map((item) => item.spotClosePrice ?? 0);
    const perpSpotDiffs = data.map((item) => item.perpSpotDiff ?? 0);
    const volumeDeltas = data.map((item) => item.volumeDelta ?? 0);
    const volumeDeltaChanges = data.map((item) => item.volumeDeltaChange ?? 0);

    const cpMin = Math.min(...closePrices);
    const cpMax = Math.max(...closePrices);
    const cpRange = cpMax - cpMin;
    const cpUniform = cpRange === 0;

    const cpChangeMin = Math.min(...closePriceChanges);
    const cpChangeMax = Math.max(...closePriceChanges);

    const brMin = Math.min(...buyerRatios);
    const brMax = Math.max(...buyerRatios);
    const brRange = brMax - brMin;
    const brUniform = brRange === 0;

    const brChangeMin = Math.min(...buyerRatioChanges);
    const brChangeMax = Math.max(...buyerRatioChanges);

    const qvMin = Math.min(...quoteVolumes);
    const qvMax = Math.max(...quoteVolumes);
    const qvRange = qvMax - qvMin;
    const qvUniform = qvRange === 0;

    const qvChangeMin = Math.min(...quoteVolumeChanges);
    const qvChangeMax = Math.max(...quoteVolumeChanges);

    const spMin = Math.min(...spotPrices);
    const spMax = Math.max(...spotPrices);
    const spRange = spMax - spMin;
    const spUniform = spRange === 0;

    const psMin = Math.min(...perpSpotDiffs);
    const psMax = Math.max(...perpSpotDiffs);

    const vdMin = Math.min(...volumeDeltas);
    const vdMax = Math.max(...volumeDeltas);
    const vdRange = vdMax - vdMin;
    const vdUniform = vdRange === 0;

    const vdChangeMin = Math.min(...volumeDeltaChanges);
    const vdChangeMax = Math.max(...volumeDeltaChanges);

    const updatedData = data.map((item) => {
      const closePrice = item.closePrice ?? 0;
      const normalizedCp = cpUniform ? 1 : (closePrice - cpMin) / cpRange;
      const cpColor = getColorFromValue(normalizedCp);

      const closePriceChange = item.closePriceChange ?? 0;
      const cpChangeColor = getColorFromChangeValue(
        closePriceChange,
        cpChangeMin,
        cpChangeMax
      );

      const buyerRatio = item.buyerRatio ?? 0;
      const normalizedBr = brUniform ? 1 : (buyerRatio - brMin) / brRange;
      const brColor = getColorFromValue(normalizedBr);

      const buyerRatioChange = item.buyerRatioChange ?? 0;
      const brChangeColor = getColorFromChangeValue(
        buyerRatioChange,
        brChangeMin,
        brChangeMax
      );

      const quoteVolume = item.quoteVolume ?? 0;
      const normalizedQv = qvUniform ? 1 : (quoteVolume - qvMin) / qvRange;
      const qvColor = getColorFromValue(normalizedQv);

      const quoteVolumeChange = item.quoteVolumeChange ?? 0;
      const qvChangeColor = getColorFromChangeValue(
        quoteVolumeChange,
        qvChangeMin,
        qvChangeMax
      );

      const spotPrice = item.spotClosePrice ?? 0;
      const normalizedSp = spUniform ? 1 : (spotPrice - spMin) / spRange;
      const spColor = getColorFromValue(normalizedSp);

      const perpSpotDiff = item.perpSpotDiff ?? 0;
      const psColor = getColorFromChangeValue(perpSpotDiff, psMin, psMax);

      const volumeDelta = item.volumeDelta ?? 0;
      const normalizedVd = vdUniform ? 1 : (volumeDelta - vdMin) / vdRange;
      const vdColor = getColorFromValue(normalizedVd);

      const volumeDeltaChange = item.volumeDeltaChange ?? 0;
      const vdChangeColor = getColorFromChangeValue(
        volumeDeltaChange,
        vdChangeMin,
        vdChangeMax
      );

      return {
        ...item,
        colors: {
          ...(item.colors || {}),
          closePrice: cpColor,
          closePriceChange: cpChangeColor,
          buyerRatio: brColor,
          buyerRatioChange: brChangeColor,
          quoteVolume: qvColor,
          quoteVolumeChange: qvChangeColor,
          spotClosePrice: spColor,
          perpSpotDiff: psColor,
          volumeDelta: vdColor,
          volumeDeltaChange: vdChangeColor,
        },
      };
    });

    return {
      ...coinData,
      data: updatedData,
    };
  });
}
