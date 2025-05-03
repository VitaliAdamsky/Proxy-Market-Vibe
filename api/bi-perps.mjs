// api/fetch-klines.mjs
import { Redis } from "@upstash/redis";
import { fetchBinancePerpKlines } from "../functions/binance/fetch-binance-perp-klines.mjs";
import { fetchBinanceSpotKlines } from "../functions/binance/fetch-binance-spot-klines.mjs";
import { calculatePriceDiff } from "../functions/utility/calculate-price-difference.mjs";

export const config = {
  runtime: "edge",
  regions: ["arn1"],
};

export default async function handler(request) {
  try {
    // 1. Get coins from Redis
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    const rawCoins = await redis.get("coins");
    const coins = Array.isArray(rawCoins) ? rawCoins : [];

    // 2. Filter Binance coins
    const binanceCoins = coins.filter((c) =>
      c?.exchanges?.includes?.("Binance")
    );

    // 3. Fetch data
    const [perps, spot] = await Promise.all([
      fetchBinancePerpKlines(binanceCoins, "h1", 4),
      fetchBinanceSpotKlines(binanceCoins, "h1", 4),
    ]);

    // 4. Merge data
    const merged = mergeData(perps, spot);

    return new Response(JSON.stringify([...spot, ...perps]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=60",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Server oopsie",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

// Simple merge logic
function mergeData(perps, spot) {
  const spotMap = {};

  // Build spot map
  for (const entry of spot) {
    const key = `${entry[0]}`; // openTime
    spotMap[key] = parseFloat(entry[4]); // closePrice
  }

  // Merge perps
  return perps.map((p) => ({
    openTime: p[0],
    perpClosePrice: parseFloat(p[4]),
    spotClosePrice: spotMap[p[0]] || null,
    diff: spotMap[p[0]]
      ? (((parseFloat(p[4]) - spotMap[p[0]]) / spotMap[p[0]]) * 100).toFixed(2)
      : null,
  }));
}
