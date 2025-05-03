// /api/greet.ts (or /api/greet.js for JavaScript)

export const config = {
  runtime: "edge", // Specifies Edge Function runtime
};

export default async function handler(request) {
  // Handle non-GET requests
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Create response data
  const data = {
    message: "Hello from the Edge! 🌍",
    timestamp: new Date().toISOString(),
    randomNumber: Math.floor(Math.random() * 1000), // Example dynamic data
  };

  // Return JSON response
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=0, must-revalidate", // Optional caching header
      // 'Access-Control-Allow-Origin': '*' // Uncomment for CORS
    },
  });
}
