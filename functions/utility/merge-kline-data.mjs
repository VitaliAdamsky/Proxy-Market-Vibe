export function mergeKlineData(perps, spot) {
  // 1. Create spot price map
  const spotMap = spot.reduce((acc, { symbol, data }) => {
    acc[symbol] = data.reduce((symbolAcc, entry) => {
      symbolAcc[entry.openTime] = entry.closePrice;
      return symbolAcc;
    }, {});
    return acc;
  }, {});

  // 2. Process all perps regardless of spot presence
  return perps.map(({ symbol, data }) => {
    let prevPerpEntry = null;
    const symbolSpotData = spotMap[symbol] || {};

    const processedData = data.map((currentPerp) => {
      // Always calculate PERP-PERP changes
      const changes = {
        quoteVolumeChange: calcChange(
          currentPerp.quoteVolume,
          prevPerpEntry?.quoteVolume
        ),
        volumeDeltaChange: calcChange(
          currentPerp.volumeDelta,
          prevPerpEntry?.volumeDelta
        ),
        closePriceChange: calcChange(
          currentPerp.closePrice,
          prevPerpEntry?.closePrice
        ),
      };

      // Add spot data if available
      const spotClosePrice = symbolSpotData[currentPerp.openTime];
      const spotMetrics = spotClosePrice
        ? {
            spotClosePrice,
            perpSpotDiff: calcChange(currentPerp.closePrice, spotClosePrice),
          }
        : {};

      prevPerpEntry = currentPerp; // Update for next iteration

      return {
        ...currentPerp,
        ...changes,
        ...spotMetrics,
      };
    });

    return { symbol, data: processedData };
  });
}

// Enhanced calculation helper
function calcChange(current, previous) {
  if (typeof previous !== "number" || previous === 0) return null;
  if (typeof current !== "number") return null;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}
