import {
  INVENTORY_CATEGORIES,
  type InventoryProductInput,
} from "./inventory-types";

type InventoryPatch = Partial<InventoryProductInput> & { stockDelta?: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function stringValue(data: Record<string, unknown>, field: string): string | undefined {
  return typeof data[field] === "string" ? data[field] : undefined;
}

function numberValue(data: Record<string, unknown>, field: string): number | undefined {
  const value = data[field];
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function validateInventoryInput(body: unknown): InventoryProductInput | { error: string } {
  if (!isRecord(body)) {
    return { error: "Cuerpo de solicitud inválido." };
  }

  const category = stringValue(body, "category");
  const name = stringValue(body, "name");
  const brand = stringValue(body, "brand");

  if (!category || !INVENTORY_CATEGORIES.includes(category as InventoryProductInput["category"])) {
    return { error: "Categoría inválida." };
  }

  if (!name?.trim() || !brand?.trim()) {
    return { error: "Marca y producto son obligatorios." };
  }

  return {
    category: category as InventoryProductInput["category"],
    name,
    brand,
    model: stringValue(body, "model"),
    variant: stringValue(body, "variant"),
    color: stringValue(body, "color"),
    connector: stringValue(body, "connector"),
    boxColor: stringValue(body, "boxColor"),
    visualLocation: stringValue(body, "visualLocation"),
    purchasePrice: numberValue(body, "purchasePrice"),
    salePrice: numberValue(body, "salePrice"),
    minimumPrice: numberValue(body, "minimumPrice"),
    stock: numberValue(body, "stock") ?? 0,
    lowStockThreshold: numberValue(body, "lowStockThreshold") ?? 2,
  };
}

export function validateInventoryPatch(body: unknown): InventoryPatch | { error: string } {
  if (!isRecord(body)) {
    return { error: "Cuerpo de solicitud inválido." };
  }

  const patch: InventoryPatch = {};
  const textFields = [
    "name",
    "brand",
    "model",
    "variant",
    "color",
    "connector",
    "boxColor",
    "visualLocation",
  ] as const;

  if (typeof body.category === "string") {
    if (!INVENTORY_CATEGORIES.includes(body.category as InventoryProductInput["category"])) {
      return { error: "Categoría inválida." };
    }
    patch.category = body.category as InventoryProductInput["category"];
  }

  for (const field of textFields) {
    if (body[field] !== undefined && typeof body[field] !== "string") {
      return { error: `El campo ${field} es inválido.` };
    }
    if (typeof body[field] === "string") {
      patch[field] = body[field];
    }
  }

  for (const field of ["purchasePrice", "salePrice", "minimumPrice", "stock", "lowStockThreshold"] as const) {
    if (body[field] !== undefined) {
      const parsed = Number(body[field]);
      if (Number.isNaN(parsed)) return { error: `El campo ${field} es inválido.` };
      patch[field] = parsed;
    }
  }

  if (body.stockDelta !== undefined) {
    const parsed = Number(body.stockDelta);
    if (Number.isNaN(parsed)) return { error: "El ajuste de stock es inválido." };
    patch.stockDelta = parsed;
  }

  return patch;
}
