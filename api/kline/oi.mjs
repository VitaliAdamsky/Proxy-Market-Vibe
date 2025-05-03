import { Redis } from "@upstash/redis";
import { fetchBybitOi } from "../../functions/bybit/fetch-bybit-oi.mjs";

import { fetchBingXOi } from "../../functions/bingx/fetch-bingx-oi.mjs";

export const config = {
  runtime: "edge",
  regions: ["lhr1"],
};

export default async function handler(request) {
  try {
    const timeframe = "h1";
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
    console.log(coins.length);
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

    const [bybitData, bingXData] = await Promise.all([
      fetchBiOi(binanceCoins, timeframe, limit),
      fetchBybitOi(bybitCoins, timeframe, limit),
      fetchBingXOi(bingXCoins, timeframe, limit),
    ]);

    if (!bybitData?.[0]?.klineData?.length) {
      return new Response(
        JSON.stringify({ error: "No valid kline data from Bybit" }),
        { status: 500 }
      );
    }
    if (!Array.isArray(bingXData)) {
      return new Response(
        JSON.stringify({ error: "Invalid data format from BingX" }),
        { status: 500 }
      );
    }

    const lastKline = bybitData[0].klineData[bybitData[0].klineData.length - 1];
    const openTime = lastKline.openTime;
    const closeTime = lastKline.closeTime;

    const bingXDataUpdated = bingXData.map((d) => ({
      symbol: d.symbol,
      category: d.klineData.category || "unknown",
      exchanges: Array.isArray(d.klineData.exchanges)
        ? d.klineData.exchanges
        : [],
      openTime: openTime,
      closeTime: closeTime,
      openInterest: d.klineData?.openInterest || 0,
    }));

    console.log(bingXData[0]);

    return new Response(
      JSON.stringify({ bingXData: bingXDataUpdated, bybitData }),
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
