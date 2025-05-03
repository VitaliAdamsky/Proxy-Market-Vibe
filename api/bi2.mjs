// /api/binance-proxy.mjs

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send("Missing 'url' query parameter");
  }

  const fullUrl = `https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1h&limit=5`;

  try {
    const binanceResponse = await fetch(fullUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "application/json",
      },
    });

    const body = await binanceResponse.text();

    res
      .status(binanceResponse.status)
      .setHeader("Content-Type", "application/json")
      .setHeader("Cache-Control", "no-store")
      .send(body);
  } catch (error) {
    console.error("[Proxy Error]", error);
    res.status(500).send("Proxy Error");
  }
}
