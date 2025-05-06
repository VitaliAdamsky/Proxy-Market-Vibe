// api/fetch-klines.mjs
import { validateRequestParams } from "../../functions/utility/validate-request-params.mjs";
import { fetchBinanceOi } from "../../functions/binance/fetch-binance-oi.mjs";
import { fetchBybitOi } from "../../functions/bybit/fetch-bybit-oi.mjs";
import { fetchCoinsFromRedis } from "../../functions/coins/fetch-coins-from-redis.mjs";
import { normalizeOpenInterestData } from "../../functions/normalize/normalize-open-interest-data.mjs";

import { calculateExpirationTime } from "../../functions/utility/calculate-expiration-time.mjs";

export const config = {
  runtime: "edge",
  regions: ["arn1"],
};

// Main handler
export default async function handler(request) {
  try {
    const params = validateRequestParams(request.url);

    // 2. Если ошибка — возвращаем её
    if (params instanceof Response) {
      return params;
    }

    const { timeframe, limitKline } = params;

    const { binancePerpCoins, bybitPerpCoins } = await fetchCoinsFromRedis();

    const [binanceOi, bybitOi] = await Promise.all([
      fetchBinanceOi(binancePerpCoins, timeframe, limitKline),
      fetchBybitOi(bybitPerpCoins, timeframe, limitKline),
    ]);

    const expirationTime = calculateExpirationTime(
      binanceOi[0]?.data.at(-1).openTime,
      timeframe
    );

    console.log("expirationTime", expirationTime);

    const data = normalizeOpenInterestData([...binanceOi, ...bybitOi]);

    return new Response(JSON.stringify({ timeframe, expirationTime, data }), {
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
