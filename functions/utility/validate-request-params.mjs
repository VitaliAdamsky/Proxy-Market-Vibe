export function validateRequestParams(url) {
  const supportedTimeframes = ["h1", "h4", "h6", "h8", "d1"];
  const defaultTimeframe = "h4";
  const defaultLimitKline = 52;
  const defaultLimitFr = 52;

  const urlObj = new URL(url);

  const timeframe = urlObj.searchParams.get("timeframe") || defaultTimeframe;

  const limitKline =
    parseInt(urlObj.searchParams.get("limitKline")) || defaultLimitKline;

  const limitFr =
    parseInt(urlObj.searchParams.get("limitFr")) || defaultLimitFr;

  // 1. Проверка timeframe
  if (!supportedTimeframes.includes(timeframe)) {
    return new Response(
      JSON.stringify({
        error: "Invalid timeframe",
        supported: supportedTimeframes,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 2. Проверка limitKline
  if (isNaN(limitKline) || limitKline < 1 || limitKline > 1000) {
    return new Response(
      JSON.stringify({
        error: "Invalid limitKline",
        range: "1–1000",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 3. Проверка limitFr
  if (isNaN(limitFr) || limitFr < 1 || limitFr > 1000) {
    return new Response(
      JSON.stringify({
        error: "Invalid limitFr",
        range: "1–1000",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return { timeframe, limitKline, limitFr };
}
