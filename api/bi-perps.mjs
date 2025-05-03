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
    const timeframe = "h1";
    const limit = 4;
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    // Retrieve and parse coin data
    const storedData = await redis.get("coins");
    const coins =
      typeof storedData === "string" ? JSON.parse(storedData) : storedData;

    if (!Array.isArray(coins)) {
      return new Response(
        JSON.stringify({ error: "Invalid data format from Redis" }),
        { status: 500 }
      );
    }

    // Process Binance data
    const binanceCoins = coins.filter((c) => c.exchanges.includes("Binance"));
    const [binancePerps] = await Promise.all([
      fetchBinancePerpKlines(binanceCoins, timeframe, limit),
    ]);

    const [binanceSpot] = await Promise.all([
      fetchBinanceSpotKlines(binanceCoins, timeframe, limit),
    ]);

    // Create spot price map by timestamp
    const spotPriceMap = new Map();
    binanceSpot.forEach((coinData) => {
      coinData.forEach((entry) => {
        spotPriceMap.set(entry.openTime, entry.closePrice);
      });
    });

    // Augment perps data with spot prices and diffs
    const augmentedPerps = binancePerps.map((coinData) => {
      return coinData.map((perpEntry) => {
        const spotClose = spotPriceMap.get(perpEntry.openTime) || null;

        return {
          ...perpEntry,
          spotClosePrice: spotClose,
          perpSpotDiff: calculatePriceDiff(perpEntry.closePrice, spotClose),
        };
      });
    });

    return new Response(
      JSON.stringify({
        klines1h: augmentedPerps.flat(),
        timestamp: Date.now(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
        },
      }
    );
  } catch (error) {
    console.error("Handler error:", error);
    return new Response(
      JSON.stringify({
        error: "Server error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
      { status: 500 }
    );
  }
}
