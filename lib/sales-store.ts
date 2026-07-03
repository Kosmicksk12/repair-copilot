import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { listInventoryProducts, updateInventoryProduct } from "./inventory-store";
import type { RegisterSaleInput, SaleRecord, SalesStore } from "./sales-types";

const DATA_DIR = join(process.cwd(), "data");
const STORE_PATH = join(DATA_DIR, "sales.json");

function ensureStore(): SalesStore {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!existsSync(STORE_PATH)) {
    const empty: SalesStore = { sales: [] };
    writeFileSync(STORE_PATH, `${JSON.stringify(empty, null, 2)}\n`, "utf8");
    return empty;
  }

  return JSON.parse(readFileSync(STORE_PATH, "utf8")) as SalesStore;
}

function persistStore(store: SalesStore): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export function listSales(): SaleRecord[] {
  return ensureStore().sales.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function registerInventorySale(input: RegisterSaleInput): SaleRecord {
  const quantity = Math.trunc(input.quantity);
  if (!input.productId) throw new Error("Producto requerido.");
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("La cantidad debe ser mayor a cero.");

  const product = listInventoryProducts().find((item) => item.id === input.productId);
  if (!product) throw new Error("Producto no encontrado en inventario.");
  if (product.stock < quantity) throw new Error("Stock insuficiente para registrar la venta.");

  const unitPrice = product.salePrice ?? product.minimumPrice ?? 0;
  const sale: SaleRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    productId: product.id,
    productName: product.name,
    productCategory: product.category,
    productBrand: product.brand,
    productModel: product.model ?? product.variant,
    quantity,
    unitPrice,
    total: unitPrice * quantity,
  };

  const updatedProduct = updateInventoryProduct(product.id, { stockDelta: -quantity });
  if (!updatedProduct) throw new Error("No se pudo actualizar el stock.");

  const store = ensureStore();
  store.sales.unshift(sale);
  persistStore(store);

  return sale;
}
