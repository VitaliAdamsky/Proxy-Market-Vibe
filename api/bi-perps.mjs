import { Redis } from "@upstash/redis";
import { fetchBinancePerpKlines } from "../functions/binance/fetch-binance-perp-klines.mjs";
import { fetchBinanceSpotKlines } from "../functions/binance/fetch-binance-spot-klines.mjs";

export const config = {
  runtime: "edge",
  regions: ["arn1"],
};

const calculatePriceDiff = (perpPrice: number, spotPrice: number): number | null => {
  if (!perpPrice || !spotPrice || spotPrice === 0) return null;
  return Number(((perpPrice - spotPrice) / spotPrice * 100).toFixed(2));
};

export default async function handler(request: Request) {
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
      .filter(c => c?.exchanges?.includes("Binance"))
      .map(c => ({
        symbol: c.symbol,
        category: c.category || "unknown",
        imageUrl: c.imageUrl || "assets/img/noname.png"
      }));

    // Fetch parallel data
    const [perpData, spotData] = await Promise.all([
      fetchBinancePerpKlines(binanceCoins, "h1", 4),
      fetchBinanceSpotKlines(binanceCoins, "h1", 4)
    ]);

    // Validate response structures
    const isValidData = (data: any) => 
      Array.isArray(data) && data.every(coinData => Array.isArray(coinData));
    
    if (!isValidData(perpData) || !isValidData(spotData)) {
      throw new Error("Invalid API response structure");
    }

    // Create spot price map: Map<`${symbol}_${timestamp}`, price>
    const spotMap = new Map<string, number>();
    spotData.forEach(coinSpotData => {
      coinSpotData.forEach(entry => {
        const key = `${entry.symbol}_${entry.openTime}`;
        spotMap.set(key, entry.closePrice);
      });
    });

    // Merge data
    const mergedData = perpData.map(coinPerpData => {
      return coinPerpData.map(perpEntry => {
        const spotKey = `${perpEntry.symbol}_${perpEntry.openTime}`;
        const spotClose = spotMap.get(spotKey) || null;
        
        return {
          ...perpEntry,
          spotClosePrice: spotClose,
          perpSpotDiff: calculatePriceDiff(perpEntry.closePrice, spotClose),
          category: binanceCoins.find(c => c.symbol === perpEntry.symbol)?.category,
          imageUrl: binanceCoins.find(c => c.symbol === perpEntry.symbol)?.imageUrl
        };
      });
    });

    return new Response(JSON.stringify({
      success: true,
      data: mergedData.flat(),
      timestamp: Date.now()
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=60, stale-while-revalidate"
      }
    });

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}