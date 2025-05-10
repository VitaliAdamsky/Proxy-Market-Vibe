// api/fetch-klines.mjs

import { fetchBinancePerpKlines } from "../../functions/binance/fetch-binance-perp-klines.mjs";
import { fetchBinanceSpotKlines } from "../../functions/binance/fetch-binance-spot-klines.mjs";
import { fetchBybitPerpKlines } from "../../functions/bybit/fetch-bybit-perp-klines.mjs";
import { fetchBybitSpotKlines } from "../../functions/bybit/fetch-bybit-spot-klines.mjs";

import { mergeSpotWithPerps } from "../../functions/utility/merges/merge-spot-with-perps.mjs";
import { validateRequestParams } from "../../functions/utility/validate-request-params.mjs";
import { normalizeKlineData } from "../../functions/normalize/normalize-kline-data.mjs";
import { calculateExpirationTime } from "../../functions/utility/calculate-expiration-time.mjs";
import { fetchBybitDominantCoinsFromRedis } from "../../functions/coins/fetch-bybit-dominant-coins-from-redis.mjs";
import { fetchBinanceDominantCoinsFromRedis } from "../../functions/coins/fetch-binance-dominant-coins-from-redis.mjs";

export const config = {
  runtime: "edge",
  regions: ["lhr1"],
};

export default async function handler(request) {
  try {
    // 1. Валидация параметров
    const params = validateRequestParams(request.url);

    // 2. Если ошибка — возвращаем её
    if (params instanceof Response) {
      return params;
    }

    const { limit } = params;
    const timeframe = "D";

    const {
      binancePerpCoins,
      binanceSpotCoins,
      bybitPerpCoins,
      bybitSpotCoins,
    } = await fetchBinanceDominantCoinsFromRedis();

    // 3. Fetch all data in parallel
    const [binancePerps, binanceSpot, bybitPerps, bybitSpot] =
      await Promise.all([
        fetchBinancePerpKlines(binancePerpCoins, timeframe, limit),
        fetchBinanceSpotKlines(binanceSpotCoins, timeframe, limit),
        fetchBybitPerpKlines(bybitPerpCoins, timeframe, limit),
        fetchBybitSpotKlines(bybitSpotCoins, timeframe, limit),
      ]);

    console.log("BybitPerps", bybitPerps.length);
    console.log("BybitSpot", bybitSpot.length);

    const expirationTime = calculateExpirationTime(
      binancePerps[0]?.data.at(-1).openTime,
      timeframe
    );

    let data = mergeSpotWithPerps(
      [...binancePerps, ...bybitPerps],
      [...binanceSpot, ...bybitSpot]
    );
    data = normalizeKlineData(data);

    return new Response(JSON.stringify({ timeframe, expirationTime, data }), {
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
