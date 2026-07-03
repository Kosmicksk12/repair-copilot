import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { randomUUID } from "crypto";
import { join } from "path";
import type {
  InventoryImportSummary,
  InventoryProduct,
  InventoryProductInput,
  InventoryStore,
} from "./inventory-types";

const DATA_DIR = join(process.cwd(), "data");
const STORE_PATH = join(DATA_DIR, "inventory.json");

function ensureStore(): InventoryStore {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!existsSync(STORE_PATH)) {
    const empty: InventoryStore = { products: [] };
    writeFileSync(STORE_PATH, `${JSON.stringify(empty, null, 2)}\n`, "utf8");
    return empty;
  }

  return JSON.parse(readFileSync(STORE_PATH, "utf8")) as InventoryStore;
}

function persistStore(store: InventoryStore): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function cleanText(value: string | undefined): string | undefined {
  const text = value?.trim();
  return text ? text : undefined;
}

function productFromInput(input: InventoryProductInput): InventoryProduct {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    category: input.category,
    name: input.name.trim(),
    brand: input.brand.trim(),
    model: cleanText(input.model),
    variant: cleanText(input.variant),
    color: cleanText(input.color),
    connector: cleanText(input.connector),
    boxColor: cleanText(input.boxColor),
    visualLocation: cleanText(input.visualLocation),
    purchasePrice: input.purchasePrice,
    salePrice: input.salePrice,
    minimumPrice: input.minimumPrice,
    observations: cleanText(input.observations),
    stock: Math.max(0, Math.trunc(input.stock)),
    lowStockThreshold: Math.max(0, Math.trunc(input.lowStockThreshold)),
    sourceCatalog: input.sourceCatalog,
    sourceKey: input.sourceKey,
    originalColumns: input.originalColumns,
    createdAt: now,
    updatedAt: now,
  };
}

export function listInventoryProducts(): InventoryProduct[] {
  return ensureStore().products.sort((a, b) => a.name.localeCompare(b.name));
}

export function createInventoryProduct(input: InventoryProductInput): InventoryProduct {
  const store = ensureStore();
  const product = productFromInput(input);
  store.products.push(product);
  persistStore(store);
  return product;
}

export function updateInventoryProduct(
  id: string,
  input: Partial<InventoryProductInput> & { stockDelta?: number },
): InventoryProduct | null {
  const store = ensureStore();
  const index = store.products.findIndex((product) => product.id === id);
  if (index === -1) return null;

  const current = store.products[index];
  const nextStock =
    input.stockDelta !== undefined
      ? current.stock + input.stockDelta
      : input.stock !== undefined
        ? input.stock
        : current.stock;

  const updated: InventoryProduct = {
    ...current,
    ...input,
    name: input.name?.trim() ?? current.name,
    brand: input.brand?.trim() ?? current.brand,
    model: input.model !== undefined ? cleanText(input.model) : current.model,
    variant: input.variant !== undefined ? cleanText(input.variant) : current.variant,
    color: input.color !== undefined ? cleanText(input.color) : current.color,
    connector: input.connector !== undefined ? cleanText(input.connector) : current.connector,
    boxColor: input.boxColor !== undefined ? cleanText(input.boxColor) : current.boxColor,
    visualLocation:
      input.visualLocation !== undefined ? cleanText(input.visualLocation) : current.visualLocation,
    observations: input.observations !== undefined ? cleanText(input.observations) : current.observations,
    stock: Math.max(0, Math.trunc(nextStock)),
    lowStockThreshold:
      input.lowStockThreshold !== undefined
        ? Math.max(0, Math.trunc(input.lowStockThreshold))
        : current.lowStockThreshold,
    updatedAt: new Date().toISOString(),
  };

  delete (updated as { stockDelta?: number }).stockDelta;
  store.products[index] = updated;
  persistStore(store);
  return updated;
}

export function deleteInventoryProduct(id: string): boolean {
  const store = ensureStore();
  const nextProducts = store.products.filter((product) => product.id !== id);
  if (nextProducts.length === store.products.length) return false;

  store.products = nextProducts;
  persistStore(store);
  return true;
}

export function importInventoryProducts(
  products: InventoryProductInput[],
  summary: Omit<InventoryImportSummary, "added" | "updated">,
): InventoryImportSummary {
  const store = ensureStore();
  let added = 0;
  let updated = 0;

  for (const input of products) {
    const existingIndex =
      input.sourceKey !== undefined
        ? store.products.findIndex((product) => product.sourceKey === input.sourceKey)
        : -1;

    if (existingIndex >= 0) {
      const current = store.products[existingIndex];
      store.products[existingIndex] = {
        ...current,
        ...productFromInput(input),
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      };
      updated += 1;
    } else {
      store.products.push(productFromInput(input));
      added += 1;
    }
  }

  persistStore(store);

  return {
    ...summary,
    added,
    updated,
  };
}
