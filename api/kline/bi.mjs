// api/fetch-klines.mjs

import { fetchBinancePerpKlines } from "../../functions/binance/fetch-binance-perp-klines.mjs";
import { fetchBinanceSpotKlines } from "../../functions/binance/fetch-binance-spot-klines.mjs";
import { fetchBybitPerpKlines } from "../../functions/bybit/fetch-bybit-perp-klines.mjs";
import { fetchBybitSpotKlines } from "../../functions/bybit/fetch-bybit-spot-klines.mjs";
import { mergeKlineData } from "../../functions/utility/SHIT-merge-kline-data.mjs";
import { fetchBinanceFr } from "../../functions/binance/fetch-binance-fr.mjs";
import { fetchBybitFr } from "../../functions/bybit/fetch-bybit-fr.mjs";
import { fetchCoinsFromRedis } from "../../functions/coins/fetch-coins-from-redis.mjs";
import { fetchBinanceOi } from "../../functions/binance/fetch-binance-oi.mjs";
import { fetchBybitOi } from "../../functions/bybit/fetch-bybit-oi.mjs";

import { mergeOiWithKline } from "../../functions/utility/merge-oi-with-kline.mjs";
import { mergeSpotWithPerps } from "../../functions/utility/merge-spot-with-perps.mjs";
import { mergeFrWithKline } from "../../functions/utility/merge-fr-with-kline.mjs";

export const config = {
  runtime: "edge",
  regions: ["arn1"],
};

export default async function handler(request) {
  try {
    const timeframe = "h4";
    const limitKline = 52;
    const limitFr = 52;

    const { binancePerpCoins, binanceSpotCoins } = await fetchCoinsFromRedis();

    // 3. Fetch all data in parallel
    const [binancePerps, binanceSpot, binanceOi, binanceFr] = await Promise.all(
      [
        fetchBinancePerpKlines(binancePerpCoins, timeframe, limitKline),
        fetchBinanceSpotKlines(binanceSpotCoins, timeframe, limitKline),
        fetchBinanceOi(binancePerpCoins, timeframe, limitKline),
        fetchBinanceFr(binancePerpCoins, limitFr),
      ]
    );

    let shit = mergeOiWithKline(binancePerps, binanceOi);
    shit = mergeSpotWithPerps(shit, binanceSpot);
    shit = mergeFrWithKline(shit, binanceFr);

    // 4. Merge data

    // const mergedKlines = mergeKlineData(
    //   [...binancePerps, ...bybitPerps],
    //   [...binanceSpot, ...bybitSpot]
    // );
    // const mergedFr = [...binanceFr, ...bybitFr];
    // const mergedOi = [...binanceOi, ...bybitOi];

    // let processed;
    // processed = addFrData(mergedKlines, mergedFr);
    // processed = addOiData(processed, mergedOi);

    return new Response(JSON.stringify([...binanceFr]), {
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
