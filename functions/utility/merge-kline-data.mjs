function mergeData(perps, spot) {
  // 1. Create spot price map
  const spotMap = spot.reduce((acc, { symbol, data }) => {
    acc[symbol] = data.reduce((symbolAcc, entry) => {
      symbolAcc[entry.openTime] = entry.closePrice;
      return symbolAcc;
    }, {});
    return acc;
  }, {});

  // 2. Process perps with historical comparisons
  return perps.map(({ symbol, data }) => {
    let prevPerpEntry = null;

    const processedData = data.map((currentPerp) => {
      // Compare with previous PERP entry (not spot)
      const changes = {
        quoteVolumeChange: prevPerpEntry
          ? calcChange(currentPerp.quoteVolume, prevPerpEntry.quoteVolume)
          : null,
        deltaVolumeChange: prevPerpEntry
          ? calcChange(currentPerp.deltaVolume, prevPerpEntry.deltaVolume)
          : null,
        closePriceChange: prevPerpEntry
          ? calcChange(currentPerp.closePrice, prevPerpEntry.closePrice)
          : null,
      };

      // Store current as previous for next iteration
      prevPerpEntry = currentPerp;

      return {
        ...currentPerp,
        ...changes,
        spotClosePrice: spotMap[symbol]?.[currentPerp.openTime] || null,
        perpSpotDiff: calculatePriceDiff(
          currentPerp.closePrice,
          spotMap[symbol]?.[currentPerp.openTime]
        ),
      };
    });

    return { symbol, data: processedData };
  });
}

// Helper: Safe percentage change calculation
function calcChange(current, previous) {
  if (!previous || previous === 0) return null;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}
