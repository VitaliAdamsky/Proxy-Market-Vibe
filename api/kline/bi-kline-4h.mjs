// api/fetch-klines.mjs
import { Redis } from "@upstash/redis";
import { fetchBinancePerpKlines } from "../../functions/binance/fetch-binance-perp-klines.mjs";
import { fetchBinanceSpotKlines } from "../../functions/binance/fetch-binance-spot-klines.mjs";
import { mergeKlineData } from "../../functions/utility/merge-kline-data.mjs";
import { noBinanceSpotData } from "../../functions/utility/no-binance-spot-data.mjs";

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
    const binancePerpCoins = coins.filter((c) =>
      c?.exchanges?.includes?.("Binance")
    );

    const binanceSpotCoins = coins.filter(
      (c) =>
        c?.exchanges?.includes?.("Binance") &&
        !noBinanceSpotData.includes(c.symbol)
    );

    // 3. Fetch data
    const [perps, spot] = await Promise.all([
      fetchBinancePerpKlines(binancePerpCoins, timeframe, limit),
      fetchBinanceSpotKlines(binanceSpotCoins, timeframe, limit),
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
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
