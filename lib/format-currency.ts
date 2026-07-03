const colombianNumberFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(
  value: number | null | undefined,
  fallback = "—",
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  const roundedValue = Math.round(value);
  const sign = roundedValue < 0 ? "-" : "";
  return `${sign}$${colombianNumberFormatter.format(Math.abs(roundedValue))}`;
}
