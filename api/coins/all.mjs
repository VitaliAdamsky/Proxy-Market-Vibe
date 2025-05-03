import { Redis } from "@upstash/redis";

export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

// THIS SCRIPT BRINS DATA FROM REDIS AND RETURNS IT TO THE CLIENT

export default async function handler(request) {
  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  try {
    const key = "coins";

    // Retrieve the stored value
    const storedData = await redis.get(key);

    // If it's a string, parse it; otherwise, return as is
    const parsedData =
      typeof storedData === "string" ? JSON.parse(storedData) : storedData;

    return new Response(JSON.stringify({ coins: parsedData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
