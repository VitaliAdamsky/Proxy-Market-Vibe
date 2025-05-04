// api/fetch-klines.mjs

import { fetchBinanceFr } from "../../functions/binance/fetch-binance-fr.mjs";
import { fetchBybitFr } from "../../functions/bybit/fetch-bybit-fr.mjs";
import { fetchCoinsFromRedis } from "../../functions/coins/fetch-coins-from-redis.mjs";

export const config = {
  runtime: "edge",
  regions: ["arn1"],
};

export default async function handler(request) {
  try {
    const limit = 25;

    const { binancePerpCoins, bybitPerpCoins } = await fetchCoinsFromRedis();

    // 3. Fetch all data in parallel
    const [binanceFr, bybitFr] = await Promise.all([
      fetchBinanceFr(binancePerpCoins, limit),
      fetchBybitFr(bybitPerpCoins, limit),
    ]);

    const merged = [...binanceFr, ...bybitFr];

    return new Response(JSON.stringify(merged), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=60",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Server error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
