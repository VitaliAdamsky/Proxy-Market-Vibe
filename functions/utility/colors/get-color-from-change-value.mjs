import { interpolateColor } from "./interpolate-color.mjs";

export function getColorFromChangeValue(
  value,
  min,
  max,
  negativeColor = "#ff4d4d",
  neutralColor = "#ffffff",
  positiveColor = "#4dff4d"
) {
  const absMax = Math.max(Math.abs(min), Math.abs(max));
  const clamped = Math.max(-absMax, Math.min(absMax, value));
  const normalized = (clamped + absMax) / (2 * absMax); // 0 to 1

  return clamped < 0
    ? interpolateColor(negativeColor, neutralColor, normalized * 2)
    : interpolateColor(neutralColor, positiveColor, (normalized - 0.5) * 2);
}
