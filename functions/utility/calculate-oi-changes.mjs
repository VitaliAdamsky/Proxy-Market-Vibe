export function calculateOpenInterestChanges(data) {
  if (!Array.isArray(data)) {
    console.error("Invalid data format - expected array");
    return [];
  }

  return data.map((symbolData) => {
    if (!symbolData?.data || !Array.isArray(symbolData.data)) {
      console.warn("Invalid symbol data format:", symbolData);
      return symbolData; // Return original data
    }

    let prevOpenInterest = null;

    const processedData = symbolData.data.map((entry) => {
      const change =
        prevOpenInterest !== null && prevOpenInterest !== 0
          ? Number(
              (
                ((entry.openInterest - prevOpenInterest) / prevOpenInterest) *
                100
              ).toFixed(2)
            )
          : null;

      prevOpenInterest = entry.openInterest;

      return {
        ...entry,
        openInterestChange: change,
      };
    });

    return {
      ...symbolData,
      data: processedData,
    };
  });
}
