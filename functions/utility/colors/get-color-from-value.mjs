import { interpolateColor } from "./interpolate-color.mjs";

export function getColorFromValue(
  value,
  startColor = "#004b23",
  endColor = "#00ff00"
) {
  const clamped = Math.max(0, Math.min(1, value)); // Ensure value stays in [0,1]
  return interpolateColor(startColor, endColor, clamped);
}
