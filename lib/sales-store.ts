import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { listInventoryProducts, updateInventoryProduct } from "./inventory-store";
import type { ServiceOrder } from "./service-order-types";
import type {
  MonthlySalesSummary,
  RegisterRepairSaleInput,
  RegisterSaleInput,
  SaleRecord,
  SalesStore,
} from "./sales-types";

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

  const unitPrice = input.unitPrice ?? product.salePrice ?? product.minimumPrice ?? 0;
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
    source: input.source ?? "quick-sale",
    type: input.source === "service-order-part" ? "repuesto" : "accesorio",
    orderNumber: input.orderNumber,
  };

  const updatedProduct = updateInventoryProduct(product.id, { stockDelta: -quantity });
  if (!updatedProduct) throw new Error("No se pudo actualizar el stock.");

  const store = ensureStore();
  store.sales.unshift(sale);
  persistStore(store);

  return sale;
}

export function getRepairSaleByOrderNumber(orderNumber: string): SaleRecord | null {
  return ensureStore().sales.find(
    (sale) => sale.source === "service-order-repair" && sale.orderNumber === orderNumber,
  ) ?? null;
}

export function registerRepairSale(input: RegisterRepairSaleInput): SaleRecord {
  const total = Math.max(0, input.total);
  if (!input.orderNumber.trim()) throw new Error("Número de orden requerido.");
  if (!input.clientName.trim()) throw new Error("Cliente requerido.");
  if (total <= 0) throw new Error("El total de la reparación debe ser mayor a cero.");

  const store = ensureStore();
  const existing = store.sales.find(
    (sale) => sale.source === "service-order-repair" && sale.orderNumber === input.orderNumber,
  );
  if (existing) return existing;

  const sale: SaleRecord = {
    id: randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    quantity: 1,
    unitPrice: total,
    total,
    source: "service-order-repair",
    type: "reparación",
    orderNumber: input.orderNumber,
    clientName: input.clientName,
  };

  store.sales.unshift(sale);
  persistStore(store);
  return sale;
}

function monthKeyFromDate(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function emptyMonthlySummary(year: number, month: number): MonthlySalesSummary {
  return {
    month,
    year,
    monthKey: `${year}-${String(month).padStart(2, "0")}`,
    totalSold: 0,
    totalRepairs: 0,
    totalAccessories: 0,
    repairsCount: 0,
    accessoriesCount: 0,
    salesCount: 0,
  };
}

function getOrCreateSummary(
  summaries: Map<string, MonthlySalesSummary>,
  value: string,
): MonthlySalesSummary | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const key = monthKeyFromDate(value);
  const current = summaries.get(key);
  if (current) return current;

  const created = emptyMonthlySummary(year, month);
  summaries.set(key, created);
  return created;
}

export function buildMonthlySalesHistory(
  _orders: ServiceOrder[],
  sales: SaleRecord[] = listSales(),
): MonthlySalesSummary[] {
  const summaries = new Map<string, MonthlySalesSummary>();

  for (const sale of sales) {
    if (sale.source === "service-order-part") continue;
    const summary = getOrCreateSummary(summaries, sale.createdAt);
    if (!summary) continue;

    if (sale.source === "service-order-repair" || sale.type === "reparación") {
      summary.totalRepairs += sale.total;
      summary.repairsCount += 1;
    } else {
      summary.totalAccessories += sale.total;
      summary.accessoriesCount += 1;
    }
    summary.totalSold += sale.total;
    summary.salesCount += 1;
  }

  return [...summaries.values()].sort(
    (left, right) => right.year - left.year || right.month - left.month,
  );
}

export function getMonthlySalesSummary(
  orders: ServiceOrder[],
  date = new Date(),
  sales: SaleRecord[] = listSales(),
): MonthlySalesSummary {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const key = `${year}-${String(month).padStart(2, "0")}`;
  return buildMonthlySalesHistory(orders, sales).find((summary) => summary.monthKey === key)
    ?? emptyMonthlySummary(year, month);
}
