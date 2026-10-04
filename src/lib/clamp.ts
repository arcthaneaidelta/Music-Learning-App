export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    const tmp = min;
    min = max;
    max = tmp;
  }
  return Math.min(Math.max(value, min), max);
}
