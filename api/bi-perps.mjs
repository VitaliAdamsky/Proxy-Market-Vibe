// api/fetch-klines.mjs
import { Redis } from "@upstash/redis";
import { fetchBinancePerpKlines } from "../functions/binance/fetch-binance-perp-klines.mjs";
import { fetchBinanceSpotKlines } from "../functions/binance/fetch-binance-spot-klines.mjs";
import { calculatePriceDiff } from "../functions/utility/calculate-price-difference.mjs";

export const config = {
  runtime: "edge",
  regions: ["arn1"],
};

export default async function handler(request) {
  try {
    const timeframe = "h4";
    // 1. Get coins from Redis
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    const rawCoins = await redis.get("coins");
    const coins = Array.isArray(rawCoins) ? rawCoins : [];

    // 2. Filter Binance coins
    const binanceCoins = coins.filter((c) =>
      c?.exchanges?.includes?.("Binance")
    );

    // 3. Fetch data
    const [perps, spot] = await Promise.all([
      fetchBinancePerpKlines(binanceCoins, timeframe, 4),
      fetchBinanceSpotKlines(binanceCoins, timeframe, 4),
    ]);

    // 4. Merge data
    const merged = mergeData(perps, spot);

    return new Response(JSON.stringify([...spot, ...perps]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=60",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Server oopsie",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

// Simple merge logic
function mergeData(perps, spot) {
  // 1. Create spot price map: { [symbol]: { [openTime]: closePrice } }
  const spotMap = spot.reduce((acc, { symbol, data }) => {
    acc[symbol] = data.reduce((symbolAcc, entry) => {
      symbolAcc[entry.openTime] = entry.closePrice;
      return symbolAcc;
    }, {});
    return acc;
  }, {});

  // 2. Merge perps with spot prices
  return perps.map(({ symbol, data }) => ({
    symbol,
    data: data.map((perpEntry) => {
      const spotClose = spotMap[symbol]?.[perpEntry.openTime] || null;
      return {
        ...perpEntry,
        spotClosePrice: spotClose,
        perpSpotDiff: calculatePriceDiff(perpEntry.closePrice, spotClose),
      };
    }),
  }));
}
