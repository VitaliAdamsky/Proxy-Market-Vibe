import { Redis } from "@upstash/redis";
import { noBinanceSpotData } from "../utility/no-binance-spot-data.mjs";
import { noBybitSpotData } from "../utility/no-bybit-spot-data.mjs";

export async function fetchCoinsFromRedis() {
  // 1. Get coins from Redis
  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  const rawCoins = await redis.get("coins");
  const coins = Array.isArray(rawCoins) ? rawCoins : [];

  // 2. Filter coins
  const binancePerpCoins = coins.filter((c) =>
    c?.exchanges?.includes?.("Binance")
  );

  const binanceSpotCoins = coins.filter(
    (c) =>
      c?.exchanges?.includes?.("Binance") &&
      !noBinanceSpotData.includes(c.symbol)
  );

  const bybitPerpCoins = coins.filter(
    (c) =>
      c?.exchanges?.includes?.("Bybit") && !c?.exchanges?.includes?.("Binance")
  );

  const bybitSpotCoins = coins.filter(
    (c) =>
      c?.exchanges?.includes?.("Bybit") &&
      !c?.exchanges?.includes?.("Binance") &&
      !noBybitSpotData.includes(c.symbol)
  );

  return {
    binancePerpCoins,
    binanceSpotCoins,
    bybitPerpCoins,
    bybitSpotCoins,
  };
}
