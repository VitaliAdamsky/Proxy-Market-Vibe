// api/fetch-klines.mjs
import { calculateOpenInterestChanges } from "../../functions/utility/calculate-oi-changes.mjs";
import { fetchBinanceOi } from "../../functions/binance/fetch-binance-oi.mjs";
import { fetchBybitOi } from "../../functions/bybit/fetch-bybit-oi.mjs";
import { fetchCoins } from "../../functions/utility/fetch-coins.mjs";

export const config = {
  runtime: "edge",
  regions: ["arn1"],
};

// Main handler
export default async function handler(request) {
  const timeframe = "h4";
  const limit = 4;
  try {
    const {
      binancePerpCoins,
      binanceSpotCoins,
      bybitPerpCoins,
      bybitSpotCoins,
    } = await fetchCoins();

    // Fetch and process data
    const [binancePerps, bybitPerps] = await Promise.all([
      fetchBinanceOi(binancePerpCoins, timeframe, limit),
      fetchBybitOi(bybitPerpCoins, timeframe, limit),
    ]);

    const data = calculateOpenInterestChanges([...binancePerps, ...bybitPerps]);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Handler error:", error);
    return new Response(
      JSON.stringify({
        error: "Data processing failed",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
