import { Redis } from "@upstash/redis";

// import { fetchBinancePerpKlines } from "../../functions/binance/fetch-binance-perp-klines.mjs";
import { fetchBinancePerpKlines } from "../../functions/binance/fetch-binance-perp-klines.mjs";

export const config = {
  runtime: "edge",
  regions: ["arn1"],
};

export default async function handler(request) {
  try {
    const timeframe = "h1";
    const limit = 400;

    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    const key = "coins";

    // Retrieve the stored value
    const storedData = await redis.get(key);

    // If it's a string, parse it; otherwise, return as is
    const coins =
      typeof storedData === "string" ? JSON.parse(storedData) : storedData;

    if (!Array.isArray(coins)) {
      return new Response(
        JSON.stringify({ error: "Invalid data format from MongoDB" }),
        { status: 500 }
      );
    }

    const binanceCoins = coins.filter((c) => c.exchanges.includes("Binance"));

    const bybitCoins = coins.filter(
      (c) => c.exchanges.includes("Bybit") && !c.exchanges.includes("Binance")
    );

    const bingXCoins = coins.filter(
      (c) =>
        !c.exchanges.includes("Bybit") &&
        !c.exchanges.includes("Binance") &&
        c.exchanges.includes("BingX PF")
    );

    //const [binanceKlines, bybitKlines, bingXKlines] = await Promise.all([
    const [binanceKlines] = await Promise.all([
      fetchBinancePerpKlines(binanceCoins, timeframe, limit),
      // fetchBybitKlines(bybitCoins, timeframe, limit),
      // fetchBingXKlines(bingXCoins, timeframe, limit),
    ]);

    return new Response(JSON.stringify({ klines1h: [binanceKlines] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      { status: 500 }
    );
  }
}
