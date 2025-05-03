import { fetchCoinsFromDb } from "../../functions/coins/fetch-coins-from-db.mjs";
import { Redis } from "@upstash/redis";

export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

// THIS SCRIPT BRINS DATA FROM MONGODB AND STORES IT IN REDIS
// THE DATA IS THEN RETURNED TO THE CLIENT
export default async function handler(request) {
  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  try {
    const coins = await fetchCoinsFromDb();

    if (!Array.isArray(coins)) {
      return new Response(
        JSON.stringify({ error: "Invalid data format from MongoDB" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const key = "coins";
    await redis.set(key, JSON.stringify(coins));

    // Retrieve the stored value
    const storedData = await redis.get(key);

    // If it's a string, parse it; otherwise, return as is
    const parsedData =
      typeof storedData === "string" ? JSON.parse(storedData) : storedData;

    return new Response(JSON.stringify({ coins: parsedData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
