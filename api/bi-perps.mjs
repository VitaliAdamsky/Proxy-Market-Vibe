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
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    const storedData = await redis.get("coins");
    const coins = JSON.parse(storedData || "[]");

    if (!Array.isArray(coins)) {
      throw new Error("Invalid coins data format - expected array");
    }

    const binanceCoins = coins
      .filter((c) => c?.exchanges?.includes("Binance"))
      .map((c) => ({
        symbol: c.symbol,
        category: c.category || "unknown",
        imageUrl: c.imageUrl || "assets/img/noname.png",
        exchanges: c.exchanges || [],
      }));

    const [perpData, spotData] = await Promise.all([
      fetchBinancePerpKlines(binanceCoins, "h1", 4),
      fetchBinanceSpotKlines(binanceCoins, "h1", 4),
    ]);

    // Validate response structure
    const isValidData = (data) =>
      Array.isArray(data) && data.every((coinData) => Array.isArray(coinData));

    if (!isValidData(perpData) || !isValidData(spotData)) {
      throw new Error("Invalid API response structure");
    }

    // Create spot price map
    const spotMap = new Map();
    for (const coinSpotData of spotData) {
      for (const entry of coinSpotData) {
        const key = `${entry.symbol}_${entry.openTime}`;
        spotMap.set(key, entry.closePrice);
      }
    }

    // Merge perps with spot data
    const mergedData = [];
    for (const coinPerpData of perpData) {
      const coinData = [];

      for (const perpEntry of coinPerpData) {
        const spotKey = `${perpEntry.symbol}_${perpEntry.openTime}`;
        const spotClose = spotMap.get(spotKey) || null;

        const coinInfo =
          binanceCoins.find((c) => c.symbol === perpEntry.symbol) || {};

        coinData.push({
          ...perpEntry,
          spotClosePrice: spotClose,
          perpSpotDiff: calculatePriceDiff(perpEntry.closePrice, spotClose),
          category: coinInfo.category,
          imageUrl: coinInfo.imageUrl,
          exchanges: coinInfo.exchanges,
        });
      }

      mergedData.push(coinData);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: mergedData.flat(),
        timestamp: Date.now(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "s-maxage=60, stale-while-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
