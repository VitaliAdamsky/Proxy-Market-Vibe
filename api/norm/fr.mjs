// api/fetch-klines.mjs
import { validateRequestParams } from "../../functions/utility/validate-request-params.mjs";
import { fetchCoinsFromRedis } from "../../functions/coins/fetch-coins-from-redis.mjs";
import { fetchBinanceFr } from "../../functions/binance/fetch-binance-fr.mjs";
import { fetchBybitFr } from "../../functions/bybit/fetch-bybit-fr.mjs";
import { normalizeFundingRateData } from "../../functions/normalize/normalize-funding-rate-data.mjs";
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

    const { limitKline } = params;

    const { binancePerpCoins, bybitPerpCoins } = await fetchCoinsFromRedis();

    const [binanceFr, bybitFr] = await Promise.all([
      fetchBinanceFr(binancePerpCoins, limitKline),
      fetchBybitFr(bybitPerpCoins, limitKline),
    ]);

    const expirationTime = calculateExpirationTime(
      binanceFr[0]?.data.at(-1).openTime,
      "2h"
    );

    const data = normalizeFundingRateData([...binanceFr, ...bybitFr]);

    return new Response(
      JSON.stringify({ timeframe: "2h", expirationTime, data }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "max-age=60, stale-while-revalidate=30",
        },
      }
    );
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
