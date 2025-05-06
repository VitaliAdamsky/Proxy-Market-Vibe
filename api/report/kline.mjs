// api/fetch-klines.mjs

import { fetchBinancePerpKlines } from "../../functions/binance/fetch-binance-perp-klines.mjs";
import { fetchBinanceSpotKlines } from "../../functions/binance/fetch-binance-spot-klines.mjs";
import { fetchBybitPerpKlines } from "../../functions/bybit/fetch-bybit-perp-klines.mjs";
import { fetchBybitSpotKlines } from "../../functions/bybit/fetch-bybit-spot-klines.mjs";

import { fetchBinanceFr } from "../../functions/binance/fetch-binance-fr.mjs";
import { fetchBybitFr } from "../../functions/bybit/fetch-bybit-fr.mjs";
import { fetchCoinsFromRedis } from "../../functions/coins/fetch-coins-from-redis.mjs";
import { fetchBinanceOi } from "../../functions/binance/fetch-binance-oi.mjs";
import { fetchBybitOi } from "../../functions/bybit/fetch-bybit-oi.mjs";
import { mergeOiWithKline } from "../../functions/utility/merges/merge-oi-with-kline.mjs";
import { mergeSpotWithPerps } from "../../functions/utility/merges/merge-spot-with-perps.mjs";
import { mergeFrWithKline } from "../../functions/utility/merges/merge-fr-with-kline.mjs";
import { fixFrChange } from "../../functions/utility/fix-fr-change.mjs";
import { validateRequestParams } from "../../functions/utility/validate-request-params.mjs";

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

    const { timeframe, limitKline, limitFr } = params;

    const {
      binancePerpCoins,
      binanceSpotCoins,
      bybitPerpCoins,
      bybitSpotCoins,
    } = await fetchCoinsFromRedis();

    // 3. Fetch all data in parallel
    const [
      binancePerps,
      binanceSpot,
      bybitPerps,
      bybitSpot,
      binanceFr,
      bybitFr,
      binanceOi,
      bybitOi,
    ] = await Promise.all([
      fetchBinancePerpKlines(binancePerpCoins, timeframe, limitKline),
      fetchBinanceSpotKlines(binanceSpotCoins, timeframe, limitKline),
      fetchBybitPerpKlines(bybitPerpCoins, timeframe, limitKline),
      fetchBybitSpotKlines(bybitSpotCoins, timeframe, limitKline),
      fetchBinanceFr(binancePerpCoins, limitFr),
      fetchBybitFr(bybitPerpCoins, limitFr),
      fetchBinanceOi(binancePerpCoins, timeframe, limitKline),
      fetchBybitOi(bybitPerpCoins, timeframe, limitKline),
    ]);

    let data = mergeSpotWithPerps(
      [...binancePerps, ...bybitPerps],
      [...binanceSpot, ...bybitSpot]
    );
    data = mergeOiWithKline(data, [...binanceOi, ...bybitOi]);
    data = mergeFrWithKline(data, [...binanceFr, ...bybitFr]);
    data = fixFrChange(data);

    return new Response(JSON.stringify(data), {
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
