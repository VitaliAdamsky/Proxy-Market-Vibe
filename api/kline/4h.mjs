// api/fetch-klines.mjs

import { fetchBinancePerpKlines } from "../../functions/binance/fetch-binance-perp-klines.mjs";
import { fetchBinanceSpotKlines } from "../../functions/binance/fetch-binance-spot-klines.mjs";
import { fetchBybitPerpKlines } from "../../functions/bybit/fetch-bybit-perp-klines.mjs";
import { fetchBybitSpotKlines } from "../../functions/bybit/fetch-bybit-spot-klines.mjs";
import { mergeKlineData } from "../../functions/utility/merge-kline-data.mjs";
import { fetchBinanceFr } from "../../functions/binance/fetch-binance-fr.mjs";
import { fetchBybitFr } from "../../functions/bybit/fetch-bybit-fr.mjs";
import { fetchCoinsFromRedis } from "../../functions/coins/fetch-coins-from-redis.mjs";
import { fetchBinanceOi } from "../../functions/binance/fetch-binance-oi.mjs";
import { fetchBybitOi } from "../../functions/bybit/fetch-bybit-oi.mjs";
import { addFrData } from "../../functions/basis/add-fr-data.mjs";
import { addOiData } from "../../functions/basis/add-oi-data.mjs";

export const config = {
  runtime: "edge",
  regions: ["arn1"],
};

export default async function handler(request) {
  try {
    const timeframe = "h4";
    const limitKline = 51;
    const limitFr = 52;

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

    // 4. Merge data

    const mergedKlines = mergeKlineData(
      [...binancePerps, ...bybitPerps],
      [...binanceSpot, ...bybitSpot]
    );
    const mergedFr = [...binanceFr, ...bybitFr];
    const mergedOi = [...binanceOi, ...bybitOi];

    let processed;
    processed = addFrData(mergedKlines, mergedFr);
    processed = addOiData(processed, mergedOi);

    return new Response(JSON.stringify(processed), {
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
