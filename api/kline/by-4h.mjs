// api/fetch-klines.mjs
import { Redis } from "@upstash/redis";
import { fetchBybitPerpKlines } from "../../functions/bybit/fetch-bybit-perp-klines.mjs";
import { fetchBybitSpotKlines } from "../../functions/bybit/fetch-bybit-spot-klines.mjs";
import { mergeKlineData } from "../../functions/utility/merge-kline-data.mjs";
import { noBybitSpotData } from "../../functions/utility/no-bybit-spot-data.mjs";

export const config = {
  runtime: "edge",
  regions: ["arn1"],
};

export default async function handler(request) {
  try {
    const timeframe = "h4";
    const limit = 4;
    // 1. Get coins from Redis
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    const rawCoins = await redis.get("coins");
    const coins = Array.isArray(rawCoins) ? rawCoins : [];

    // 2. Filter Binance coins
    const bybitPerpCoins = coins.filter(
      (c) =>
        c?.exchanges?.includes?.("Bybit") &&
        !c?.exchanges?.includes?.("Binance")
    );

    const bybitSpotCoins = coins.filter(
      (c) =>
        c?.exchanges?.includes?.("Bybit") &&
        !c?.exchanges?.includes?.("Binance") &&
        !noBybitSpotData.includes(c.symbol)
    );

    // 3. Fetch data
    const [perps, spot] = await Promise.all([
      fetchBybitPerpKlines(bybitPerpCoins, timeframe, limit),
      fetchBybitSpotKlines(bybitSpotCoins, timeframe, limit),
    ]);

    // 4. Merge data
    const merged = mergeKlineData(perps, spot);

    return new Response(JSON.stringify([...merged]), {
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
        details: error,
      }),
      { status: 500 }
    );
  }
}
