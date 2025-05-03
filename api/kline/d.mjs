import { Redis } from "@upstash/redis";
import { fetchBybitKlines } from "../../functions/bybit/fetch-bybit-klines.mjs";
import { fetchBingXKlines } from "../../functions/bingx/fetch-bingx-klines.mjs";

export const config = {
  runtime: "edge",
  regions: ["cdg1"],
};

export default async function handler(request) {
  try {
    const timeframe = "D";
    const limit = 200;

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

    const bybitCoins = coins.filter((c) => c.exchanges.includes("Bybit"));

    const bingXCoins = coins.filter(
      (c) => !c.exchanges.includes("Bybit") && c.exchanges.includes("BingX PF")
    );

    const [bybitKlines, bingXKlines] = await Promise.all([
      fetchBybitKlines(bybitCoins, timeframe, limit),
      fetchBingXKlines(bingXCoins, timeframe, limit),
    ]);

    return new Response(
      JSON.stringify({ klinesD: [...bingXKlines, ...bybitKlines] }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      { status: 500 }
    );
  }
}
