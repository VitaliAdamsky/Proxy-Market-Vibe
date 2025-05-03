export const config = {
  runtime: "edge",
  regions: ["cdg1"],
};

export default async function handler(request) {
  // Validate method
  if (!["GET", "HEAD"].includes(request.method)) {
    return new Response("Method not allowed", {
      status: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  // Create base URL
  const baseUrl = new URL("https://api.binance.com/api/v3/klines");

  // Get query parameters from request
  const requestUrl = new URL(request.url);
  const params = new URLSearchParams(requestUrl.search);

  // Copy all parameters to base URL
  params.forEach((value, key) => {
    baseUrl.searchParams.append(key, value);
  });

  // Configure headers
  const headers = new Headers(request.headers);
  headers.set(
    "User-Agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
  );
  headers.set("Accept", "*/*");
  headers.set("Accept-Language", "en-US,en;q=0.9");
  headers.set("Origin", "https://www.binance.com");
  headers.set("Referer", "https://www.binance.com/");

  // Remove Vercel identifiers
  ["x-vercel-id", "x-vercel-ip-country", "x-vercel-deployment-url"].forEach(
    (h) => headers.delete(h)
  );

  try {
    const response = await fetch(baseUrl, {
      method: "GET",
      headers,
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Proxy error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
