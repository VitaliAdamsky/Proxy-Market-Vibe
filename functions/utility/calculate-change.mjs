// Функция для вычисления изменений в процентах
export function calcChange(current, previous) {
  if (typeof previous !== "number" || previous === 0) return null;
  if (typeof current !== "number") return null;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(2));
}
