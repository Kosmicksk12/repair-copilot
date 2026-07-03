import type {
  InventoryCategory,
  InventoryImportSummary,
  InventoryProductInput,
} from "./inventory-types";
import { readFirstSheet } from "./xlsx-lite";

type ExcelRow = Record<string, string>;

type InventoryNormalizer = {
  readonly category: InventoryCategory;
  matches(headers: string[]): boolean;
  normalize(row: ExcelRow, fileName: string): InventoryProductInput | null;
};

const LOW_STOCK_THRESHOLD = 2;

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function value(row: ExcelRow, header: string): string {
  const target = normalizeText(header);
  const entry = Object.entries(row).find(([key]) => normalizeText(key) === target);
  return entry?.[1]?.trim() ?? "";
}

function hasHeaders(headers: string[], requiredHeaders: string[]): boolean {
  const available = new Set(headers.map(normalizeText).filter(Boolean));
  return requiredHeaders.every((header) => available.has(normalizeText(header)));
}

function numberValue(value: string): number | undefined {
  const clean = value
    .replace(/\s+/g, "")
    .replace(/[^\d,.-]/g, "")
    .trim();

  if (!clean) return undefined;

  const lastComma = clean.lastIndexOf(",");
  const lastDot = clean.lastIndexOf(".");
  let normalized = clean;

  if (lastComma >= 0 && lastDot >= 0) {
    normalized =
      lastComma > lastDot
        ? clean.replace(/\./g, "").replace(",", ".")
        : clean.replace(/,/g, "");
  } else if (lastComma >= 0) {
    const decimals = clean.length - lastComma - 1;
    normalized = decimals === 3 ? clean.replace(/,/g, "") : clean.replace(",", ".");
  } else if (lastDot >= 0) {
    const decimals = clean.length - lastDot - 1;
    normalized = decimals === 3 ? clean.replace(/\./g, "") : clean;
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function stockValue(value: string | undefined): number {
  const parsed = numberValue(value ?? "");
  return parsed === undefined ? 0 : Math.max(0, Math.trunc(parsed));
}

function sourceKey(category: InventoryCategory, values: Array<string | undefined>): string {
  return `${category}:${values.map((entry) => normalizeText(entry ?? "")).join("|")}`;
}

function originalColumns(row: ExcelRow): Record<string, string> {
  return Object.fromEntries(Object.entries(row).filter(([, entry]) => entry.trim() !== ""));
}

function mergeDuplicateProducts(products: InventoryProductInput[]): InventoryProductInput[] {
  const merged = new Map<string, InventoryProductInput>();

  for (const product of products) {
    const key = product.sourceKey ?? `${product.category}:${product.brand}:${product.name}`;
    const current = merged.get(key);

    if (!current) {
      merged.set(key, product);
      continue;
    }

    merged.set(key, {
      ...current,
      stock: current.stock + product.stock,
      originalColumns: {
        ...(current.originalColumns ?? {}),
        ...(product.originalColumns ?? {}),
      },
    });
  }

  return [...merged.values()];
}

class AudifonosNormalizer implements InventoryNormalizer {
  readonly category = "Audifonos" as const;

  matches(headers: string[]): boolean {
    return hasHeaders(headers, ["Marca", "Tipo", "Modelo", "Conexion", "Color", "Venta", "Stock"]);
  }

  normalize(row: ExcelRow, fileName: string): InventoryProductInput | null {
    const brand = value(row, "Marca");
    const variant = value(row, "Tipo");
    const model = value(row, "Modelo");
    const connector = value(row, "Conexion");
    const color = value(row, "Color");

    if (!brand && !model) return null;

    return {
      category: this.category,
      name: model,
      brand,
      model,
      variant,
      connector,
      color,
      purchasePrice: numberValue(value(row, "Compra")),
      salePrice: numberValue(value(row, "Venta")),
      stock: stockValue(value(row, "Stock")),
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      sourceCatalog: fileName,
      sourceKey: sourceKey(this.category, [brand, variant, model, connector, color]),
      originalColumns: originalColumns(row),
    };
  }
}

class CablesNormalizer implements InventoryNormalizer {
  readonly category = "Cables" as const;

  matches(headers: string[]): boolean {
    return hasHeaders(headers, [
      "Marca",
      "Tipo de Cable",
      "Color del Cable",
      "Color de Caja",
      "Venta",
      "Stock",
    ]);
  }

  normalize(row: ExcelRow, fileName: string): InventoryProductInput | null {
    const brand = value(row, "Marca");
    const cableType = value(row, "Tipo de Cable");
    const cableColor = value(row, "Color del Cable");
    const boxColor = value(row, "Color de Caja");

    if (!brand && !cableType) return null;

    return {
      category: this.category,
      name: cableType,
      brand,
      variant: cableType,
      color: cableColor,
      boxColor,
      purchasePrice: numberValue(value(row, "Compra")),
      salePrice: numberValue(value(row, "Venta")),
      stock: stockValue(value(row, "Stock")),
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      sourceCatalog: fileName,
      sourceKey: sourceKey(this.category, [brand, cableType, cableColor, boxColor]),
      originalColumns: originalColumns(row),
    };
  }
}

class CargadoresNormalizer implements InventoryNormalizer {
  readonly category = "Cargadores" as const;

  matches(headers: string[]): boolean {
    return hasHeaders(headers, [
      "Marca",
      "Producto",
      "Tipo de Conector",
      "Color",
      "Ubicacion Visual",
      "Venta",
      "Stock",
    ]);
  }

  normalize(row: ExcelRow, fileName: string): InventoryProductInput | null {
    const brand = value(row, "Marca");
    const productName = value(row, "Producto");
    const connector = value(row, "Tipo de Conector");
    const color = value(row, "Color");
    const visualLocation = value(row, "Ubicacion Visual");

    if (!brand && !productName) return null;

    return {
      category: this.category,
      name: productName,
      brand,
      variant: productName,
      connector,
      color,
      visualLocation,
      purchasePrice: numberValue(value(row, "Compra")),
      salePrice: numberValue(value(row, "Venta")),
      stock: stockValue(value(row, "Stock")),
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      sourceCatalog: fileName,
      sourceKey: sourceKey(this.category, [brand, productName, connector, color, visualLocation]),
      originalColumns: originalColumns(row),
    };
  }
}

class ForrosNormalizer implements InventoryNormalizer {
  readonly category = "Forros" as const;

  matches(headers: string[]): boolean {
    return hasHeaders(headers, [
      "Marca",
      "Modelo",
      "Tipo",
      "Color",
      "Venta",
      "Precio Minimo",
      "Observaciones",
    ]);
  }

  normalize(row: ExcelRow, fileName: string): InventoryProductInput | null {
    const brand = value(row, "Marca");
    const model = value(row, "Modelo");
    const variant = value(row, "Tipo");
    const color = value(row, "Color");
    const observations = value(row, "Observaciones");
    const hasNoStockMarker = [variant, color, observations].some((entry) =>
      normalizeText(entry).includes("no stock"),
    );
    const explicitStock = stockValue(value(row, "Stock"));

    if (!brand && !model) return null;

    return {
      category: this.category,
      name: model,
      brand,
      model,
      variant,
      color,
      purchasePrice: numberValue(value(row, "Compra")),
      salePrice: numberValue(value(row, "Venta")),
      minimumPrice: numberValue(value(row, "Precio Minimo")),
      observations,
      stock: hasNoStockMarker ? 0 : explicitStock || 1,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      sourceCatalog: fileName,
      sourceKey: sourceKey(this.category, [brand, model, variant, color]),
      originalColumns: originalColumns(row),
    };
  }
}

const normalizers: InventoryNormalizer[] = [
  new ForrosNormalizer(),
  new CablesNormalizer(),
  new CargadoresNormalizer(),
  new AudifonosNormalizer(),
];

export function detectCatalog(headers: string[]): InventoryNormalizer {
  const normalizer = normalizers.find((candidate) => candidate.matches(headers));

  if (!normalizer) {
    throw new Error("No se pudo detectar el tipo de catálogo.");
  }

  return normalizer;
}

export function parseInventoryCatalog(
  buffer: Buffer,
  fileName: string,
): { products: InventoryProductInput[]; summary: Omit<InventoryImportSummary, "added" | "updated"> } {
  const sheet = readFirstSheet(buffer);
  const normalizer = detectCatalog(sheet.headers);
  const products = mergeDuplicateProducts(
    sheet.rows
      .map((row) => normalizer.normalize(row, fileName))
      .filter((product): product is InventoryProductInput => product !== null && product.name.trim() !== ""),
  );

  return {
    products,
    summary: {
      catalogType: normalizer.category,
      fileName,
      processedRows: products.length,
      skipped: sheet.rows.length - products.length,
    },
  };
}
