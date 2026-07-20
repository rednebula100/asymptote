export const radiansToDegrees = (radians: number): number =>
  radians * (180 / Math.PI);

export const formatNumber = (value: number, digits = 4): string => {
  if (!Number.isFinite(value)) return "Unavailable";
  if (value !== 0 && (Math.abs(value) >= 10_000 || Math.abs(value) < 0.0001)) {
    return value.toExponential(3);
  }
  return value.toFixed(digits);
};

export const formatDegrees = (radians: number, digits = 2): string => {
  const degrees = radiansToDegrees(radians);
  return Number.isFinite(degrees) ? `${degrees.toFixed(digits)}°` : "Unavailable";
};

export const formatTimestamp = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "Invalid date"
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
};
