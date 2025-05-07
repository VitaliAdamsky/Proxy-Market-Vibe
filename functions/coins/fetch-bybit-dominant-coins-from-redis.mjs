import { Redis } from "@upstash/redis";
import { noBinanceSpotData } from "../utility/no-data/no-binance-spot-data.mjs";
import { noBybitSpotData } from "../utility/no-data/no-bybit-spot-data.mjs";

export async function fetchBybitDominantCoinsFromRedis() {
  // 1. Get coins from Redis
  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  const rawCoins = await redis.get("coins");
  const coins = Array.isArray(rawCoins) ? rawCoins : [];

  // 2. Filter coins
  const bybitPerpCoins = coins.filter((c) => c?.exchanges?.includes?.("Bybit"));

  const bybitSpotCoins = coins.filter(
    (c) =>
      c?.exchanges?.includes?.("Bybit") && !noBybitSpotData.includes(c.symbol)
  );

  const binancePerpCoins = coins.filter(
    (c) =>
      c?.exchanges?.includes?.("Binance") && !c?.exchanges?.includes?.("Bybit")
  );

  const binanceSpotCoins = coins.filter(
    (c) =>
      c?.exchanges?.includes?.("Binance") &&
      !c?.exchanges?.includes?.("Bybit") &&
      !noBinanceSpotData.includes(c.symbol)
  );

  return {
    bybitPerpCoins,
    bybitSpotCoins,
    binancePerpCoins,
    binanceSpotCoins,
  };
}
