const companyReplacementRules = [
  {
    pattern: /\bAppleFix\s*Telefonos\b/gi,
    replacement: "historial de reparaciones",
  },
  {
    pattern: /\bApple\s+Fix\b/gi,
    replacement: "historial de reparaciones",
  },
  {
    pattern: /\bAppleFix\b/gi,
    replacement: "historial de reparaciones",
  },
];

const hiddenEconomicKeys = new Set([
  "valorVenta",
  "saldoPendiente",
  "estadoPago",
  "valorPotencialPerdido",
  "dineroPotencialRecuperable",
]);

export function sanitizeCompanyReferences(value: string) {
  return companyReplacementRules.reduce(
    (text, rule) => text.replace(rule.pattern, rule.replacement),
    value,
  );
}

export function sanitizeAnalysisOutput<T>(value: T): T {
  if (typeof value === "string") {
    return sanitizeCompanyReferences(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAnalysisOutput(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !hiddenEconomicKeys.has(key))
        .map(([key, entry]) => [
          key,
          sanitizeAnalysisOutput(entry),
        ]),
    ) as T;
  }

  return value;
}
