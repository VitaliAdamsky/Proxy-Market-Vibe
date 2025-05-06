import { getIntervalDurationMs } from "./get-interval-duration-ms.mjs";

export function calculateExpirationTime(openTime, timeframe) {
  if (typeof openTime !== "number" && typeof openTime !== "string") {
    return undefined;
  }

  const intervalMs = getIntervalDurationMs(timeframe);
  if (typeof intervalMs !== "number" || isNaN(intervalMs) || intervalMs <= 0) {
    return undefined;
  }

  const parsedOpenTime = Number(openTime);
  if (isNaN(parsedOpenTime)) {
    return undefined;
  }

  return parsedOpenTime + 2 * intervalMs + 1;
}
