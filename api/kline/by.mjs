// api/fetch-klines.mjs

import { fetchBybitPerpKlines } from "../../functions/bybit/fetch-bybit-perp-klines.mjs";
import { fetchBybitSpotKlines } from "../../functions/bybit/fetch-bybit-spot-klines.mjs";
import { fetchBybitFr } from "../../functions/bybit/fetch-bybit-fr.mjs";
import { fetchCoinsFromRedis } from "../../functions/coins/fetch-coins-from-redis.mjs";
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
    const limitKline = 8;
    const limitFr = 8;

    const { bybitPerpCoins, bybitSpotCoins } = await fetchCoinsFromRedis();

    // 3. Fetch all data in parallel
    const [bybitPerps, bybitSpot, bybitOi, bybitFr] = await Promise.all([
      fetchBybitPerpKlines(bybitPerpCoins, timeframe, limitKline),
      fetchBybitSpotKlines(bybitSpotCoins, timeframe, limitKline),
      fetchBybitOi(bybitPerpCoins, timeframe, limitKline),
      fetchBybitFr(bybitPerpCoins, limitFr),
    ]);

    let shit = mergeSpotWithPerps(bybitPerps, bybitSpot);
    shit = mergeOiWithKline(shit, bybitOi);
    shit = mergeFrWithKline(shit, bybitFr);

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

    return new Response(JSON.stringify([...shit]), {
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
