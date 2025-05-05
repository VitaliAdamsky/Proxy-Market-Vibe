// api/fetch-klines.mjs
import { calculateOpenInterestChanges } from "../../functions/utility/calculate-oi-changes.mjs";
import { fetchBinanceOi } from "../../functions/binance/fetch-binance-oi.mjs";
import { fetchBybitOi } from "../../functions/bybit/fetch-bybit-oi.mjs";
import { fetchCoinsFromRedis } from "../../functions/coins/fetch-coins-from-redis.mjs";

export const config = {
  runtime: "edge",
  regions: ["arn1"],
};

// Main handler
export default async function handler(request) {
  const timeframe = "h4";
  const limit = 52;
  try {
    const { binancePerpCoins, bybitPerpCoins } = await fetchCoinsFromRedis();

    // Fetch and process data
    const [binancePerps, bybitPerps] = await Promise.all([
      fetchBinanceOi(binancePerpCoins, timeframe, limit),
      fetchBybitOi(bybitPerpCoins, timeframe, limit),
    ]);

    return new Response(JSON.stringify([...binancePerps, ...bybitPerps]), {
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
