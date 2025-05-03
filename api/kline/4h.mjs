// api/fetch-klines.mjs

import { fetchBinancePerpKlines } from "../../functions/binance/fetch-binance-perp-klines.mjs";
import { fetchBinanceSpotKlines } from "../../functions/binance/fetch-binance-spot-klines.mjs";
import { fetchBybitPerpKlines } from "../../functions/bybit/fetch-bybit-perp-klines.mjs";
import { fetchBybitSpotKlines } from "../../functions/bybit/fetch-bybit-spot-klines.mjs";
import { mergeKlineData } from "../../functions/utility/merge-kline-data.mjs";
import { noBinanceSpotData } from "../../functions/utility/no-binance-spot-data.mjs";
import { noBybitSpotData } from "../../functions/utility/no-bybit-spot-data.mjs";
import { fetchCoins } from "../../functions/utility/fetch-coins.mjs";

export const config = {
  runtime: "edge",
  regions: ["arn1"],
};

export default async function handler(request) {
  try {
    const timeframe = "h4";
    const limit = 4;

    const {
      binancePerpCoins,
      binanceSpotCoins,
      bybitPerpCoins,
      bybitSpotCoins,
    } = await fetchCoins();

    // 3. Fetch all data in parallel
    const [binancePerps, binanceSpot, bybitPerps, bybitSpot] =
      await Promise.all([
        fetchBinancePerpKlines(binancePerpCoins, timeframe, limit),
        fetchBinanceSpotKlines(binanceSpotCoins, timeframe, limit),
        fetchBybitPerpKlines(bybitPerpCoins, timeframe, limit),
        fetchBybitSpotKlines(bybitSpotCoins, timeframe, limit),
      ]);

    // 4. Merge data
    const merged = mergeKlineData(
      [...binancePerps, ...bybitPerps],
      [...binanceSpot, ...bybitSpot]
    );

    return new Response(JSON.stringify(merged), {
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
