// api/fetch-klines.mjs

import { fetchBinancePerpKlines } from "../../functions/binance/fetch-binance-perp-klines.mjs";
import { fetchBinanceSpotKlines } from "../../functions/binance/fetch-binance-spot-klines.mjs";
import { fetchBybitPerpKlines } from "../../functions/bybit/fetch-bybit-perp-klines.mjs";
import { fetchBybitSpotKlines } from "../../functions/bybit/fetch-bybit-spot-klines.mjs";

import { fetchCoinsFromRedis } from "../../functions/coins/fetch-coins-from-redis.mjs";
import { mergeSpotWithPerps } from "../../functions/utility/merges/merge-spot-with-perps.mjs";
import { validateRequestParams } from "../../functions/utility/validate-request-params.mjs";
import { normalizeKlineData } from "../../functions/normalize/normalize-kline-data.mjs";
import { calculateExpirationTime } from "../../functions/utility/calculate-expiration-time.mjs";

export const config = {
  runtime: "edge",
  regions: ["arn1"],
};

export default async function handler(request) {
  try {
    // 1. Валидация параметров
    const params = validateRequestParams(request.url);

    // 2. Если ошибка — возвращаем её
    if (params instanceof Response) {
      return params;
    }

    const { timeframe, limitKline } = params;
    console.log("params", params);
    const {
      binancePerpCoins,
      binanceSpotCoins,
      bybitPerpCoins,
      bybitSpotCoins,
    } = await fetchCoinsFromRedis();

    // 3. Fetch all data in parallel
    const [binancePerps, binanceSpot, bybitPerps, bybitSpot] =
      await Promise.all([
        fetchBinancePerpKlines(binancePerpCoins, timeframe, limitKline),
        fetchBinanceSpotKlines(binanceSpotCoins, timeframe, limitKline),
        fetchBybitPerpKlines(bybitPerpCoins, timeframe, limitKline),
        fetchBybitSpotKlines(bybitSpotCoins, timeframe, limitKline),
      ]);

    console.log("binancePerps", binancePerps.length);

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
