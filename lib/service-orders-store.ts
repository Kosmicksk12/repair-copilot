import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import type {
  CreateServiceOrderInput,
  PublicOrderStatus,
  RepairStatus,
  ServiceOrder,
  ServiceOrderListFilters,
  ServiceOrderPart,
  ServiceOrderStatusHistoryEntry,
  ServiceOrderStore,
  UpdateServiceOrderInput,
} from "./service-order-types";
import { DEFAULT_WARRANTY_DAYS } from "./warranty-terms";
import { listInventoryProducts } from "./inventory-store";
import { getRepairSaleByOrderNumber, registerInventorySale, registerRepairSale } from "./sales-store";

const DATA_DIR = join(process.cwd(), "data");
const STORE_PATH = join(DATA_DIR, "service-orders.json");
const ORDER_PREFIX = "FP";

function ensureStore(): ServiceOrderStore {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!existsSync(STORE_PATH)) {
    const empty: ServiceOrderStore = { lastSequence: 0, orders: [] };
    writeFileSync(STORE_PATH, `${JSON.stringify(empty, null, 2)}\n`, "utf8");
    return empty;
  }

  return JSON.parse(readFileSync(STORE_PATH, "utf8")) as ServiceOrderStore;
}

function persistStore(store: ServiceOrderStore): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function toMoney(value: unknown): number {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function normalizeParts(parts: ServiceOrderPart[] | undefined): ServiceOrderPart[] {
  if (!Array.isArray(parts)) return [];

  const products = listInventoryProducts();
  const normalized: ServiceOrderPart[] = [];

  for (const part of parts) {
    const product = products.find((item) => item.id === part.productId);
    const quantity = Math.max(1, Math.trunc(toMoney(part.quantity)));
    const unitPrice = toMoney(part.unitPrice || product?.salePrice || product?.minimumPrice || 0);
    const productName = product?.name ?? part.productName;
    const productBrand = product?.brand ?? part.productBrand;
    const productCategory = product?.category ?? part.productCategory;
    const productModel = product?.model ?? product?.variant ?? part.productModel;

    if (!part.productId || !productName || !productBrand || !productCategory) continue;

    normalized.push({
      productId: part.productId,
      productName,
      productCategory,
      productBrand,
      ...(productModel ? { productModel } : {}),
      quantity,
      unitPrice,
      subtotal: unitPrice * quantity,
    });
  }

  return normalized;
}

function withFinancialTotals(
  order: Omit<
    ServiceOrder,
    "parts" | "partsSubtotal" | "laborTotal" | "finalTotal" | "paidAmount" | "balanceDue" | "statusHistory"
  > & Partial<Pick<ServiceOrder, "parts" | "partsSubtotal" | "laborTotal" | "finalTotal" | "paidAmount" | "balanceDue" | "statusHistory">>,
): ServiceOrder {
  const parts = normalizeParts(order.parts);
  const partsSubtotal = parts.reduce((total, part) => total + part.subtotal, 0);
  const laborTotal = toMoney(order.laborCost);
  const discount = toMoney(order.discount);
  const advance = toMoney(order.advance);
  const finalPayment = toMoney(order.finalPayment);
  const paidAmount = advance + finalPayment;
  const finalTotal = Math.max(0, partsSubtotal + laborTotal - discount);
  const balanceDue = Math.max(0, finalTotal - paidAmount);
  const statusHistory = Array.isArray(order.statusHistory) && order.statusHistory.length > 0
    ? order.statusHistory
    : [{ status: order.status, changedAt: order.createdAt }];

  return {
    ...order,
    parts,
    partsSubtotal,
    laborCost: laborTotal,
    laborTotal,
    discount,
    finalTotal,
    advance,
    finalPayment,
    paidAmount,
    balanceDue,
    statusHistory,
  };
}

function appendStatusHistory(
  history: ServiceOrderStatusHistoryEntry[] | undefined,
  status: RepairStatus,
  changedAt: string,
): ServiceOrderStatusHistoryEntry[] {
  const current = Array.isArray(history) ? history : [];
  if (current[current.length - 1]?.status === status) return current;
  return [...current, { status, changedAt }];
}

export function formatOrderNumber(sequence: number): string {
  return `${ORDER_PREFIX}-${String(sequence).padStart(6, "0")}`;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function maskClientName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "***";
  if (parts.length === 1) {
    return parts[0].length <= 2 ? `${parts[0][0]}***` : `${parts[0].slice(0, 2)}***`;
  }
  return `${parts[0]} ${parts[parts.length - 1][0]}***`;
}

export function getPublicOrderUrl(orderNumber: string, baseUrl?: string): string {
  const origin = baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${origin.replace(/\/$/, "")}/orden/${encodeURIComponent(orderNumber)}`;
}

export function toPublicOrderStatus(order: ServiceOrder, baseUrl?: string): PublicOrderStatus {
  const now = Date.now();
  const warrantyExpiresAt = order.warrantyExpiresAt;
  const warrantyActive = warrantyExpiresAt ? new Date(warrantyExpiresAt).getTime() > now : false;

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    brand: order.brand,
    model: order.model,
    clientNameMasked: maskClientName(order.clientName),
    warrantyActive,
    warrantyExpiresAt: order.warrantyExpiresAt,
    publicUrl: getPublicOrderUrl(order.orderNumber, baseUrl),
  };
}

export function listServiceOrders(filters: ServiceOrderListFilters = {}): ServiceOrder[] {
  const store = ensureStore();
  let orders = store.orders.map(withFinancialTotals).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (filters.status) {
    orders = orders.filter((order) => order.status === filters.status);
  }

  if (filters.clientPhone) {
    const phone = filters.clientPhone.replace(/\D/g, "");
    orders = orders.filter((order) => order.clientPhone.replace(/\D/g, "").includes(phone));
  }

  if (filters.search) {
    const query = filters.search.toLowerCase();
    orders = orders.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.clientName.toLowerCase().includes(query) ||
        order.clientPhone.includes(query) ||
        order.brand.toLowerCase().includes(query) ||
        order.model.toLowerCase().includes(query) ||
        (order.imei ?? "").includes(query),
    );
  }

  return orders;
}

export function getServiceOrderByNumber(orderNumber: string): ServiceOrder | null {
  const store = ensureStore();
  const order = store.orders.find((item) => item.orderNumber === orderNumber);
  return order ? withFinancialTotals(order) : null;
}

export function getServiceOrdersByClientPhone(phone: string): ServiceOrder[] {
  const normalized = phone.replace(/\D/g, "");
  return listServiceOrders().filter((order) => order.clientPhone.replace(/\D/g, "") === normalized);
}

export function createServiceOrder(input: CreateServiceOrderInput): ServiceOrder {
  const store = ensureStore();
  const nextSequence = store.lastSequence + 1;
  const now = new Date().toISOString();
  const warrantyDays = input.warrantyDays ?? DEFAULT_WARRANTY_DAYS;

  const order: ServiceOrder = withFinancialTotals({
    id: randomUUID(),
    orderNumber: formatOrderNumber(nextSequence),
    createdAt: now,
    updatedAt: now,
    clientName: input.clientName.trim(),
    clientPhone: input.clientPhone.trim(),
    clientId: input.clientId,
    brand: input.brand.trim(),
    model: input.model.trim(),
    imei: input.imei?.trim() || undefined,
    color: input.color.trim(),
    reportedDamage: input.reportedDamage.trim(),
    technicalDiagnosis: input.technicalDiagnosis?.trim() || undefined,
    accessories: input.accessories,
    physicalCondition: input.physicalCondition.trim(),
    observations: input.observations.trim(),
    estimatedValue: input.estimatedValue,
    laborCost: input.laborCost,
    parts: input.parts,
    discount: input.discount,
    advance: input.advance,
    finalPayment: input.finalPayment,
    status: input.status,
    statusHistory: [{ status: input.status, changedAt: now }],
    technicianName: input.technicianName?.trim() || undefined,
    warrantyDays,
    warrantyExpiresAt: addDays(now, warrantyDays),
  });

  store.lastSequence = nextSequence;
  store.orders.unshift(order);
  persistStore(store);

  if (order.status !== "Pagada" && order.finalTotal > 0 && order.balanceDue <= 0) {
    return payServiceOrder(order.orderNumber) ?? order;
  }

  return order;
}

export function updateServiceOrder(
  orderNumber: string,
  input: UpdateServiceOrderInput,
): ServiceOrder | null {
  const store = ensureStore();
  const index = store.orders.findIndex((order) => order.orderNumber === orderNumber);

  if (index === -1) return null;

  const current = withFinancialTotals(store.orders[index]);
  const now = new Date().toISOString();
  const nextStatus = input.status ?? current.status;

  const updated: ServiceOrder = withFinancialTotals({
    ...current,
    ...input,
    clientName: input.clientName?.trim() ?? current.clientName,
    clientPhone: input.clientPhone?.trim() ?? current.clientPhone,
    brand: input.brand?.trim() ?? current.brand,
    model: input.model?.trim() ?? current.model,
    imei: input.imei !== undefined ? input.imei.trim() || undefined : current.imei,
    color: input.color?.trim() ?? current.color,
    reportedDamage: input.reportedDamage?.trim() ?? current.reportedDamage,
    technicalDiagnosis:
      input.technicalDiagnosis !== undefined
        ? input.technicalDiagnosis.trim() || undefined
        : current.technicalDiagnosis,
    physicalCondition: input.physicalCondition?.trim() ?? current.physicalCondition,
    observations: input.observations?.trim() ?? current.observations,
    accessories: input.accessories ?? current.accessories,
    parts: input.parts ?? current.parts,
    laborCost: input.laborCost ?? current.laborCost,
    discount: input.discount ?? current.discount,
    advance: input.advance ?? current.advance,
    finalPayment: input.finalPayment ?? current.finalPayment,
    technicianName:
      input.technicianName !== undefined
        ? input.technicianName.trim() || undefined
        : current.technicianName,
    updatedAt: now,
    statusHistory:
      nextStatus !== current.status
        ? appendStatusHistory(current.statusHistory, nextStatus, now)
        : current.statusHistory,
    deliveredAt:
      nextStatus === "Entregado" && !current.deliveredAt
        ? now
        : input.deliveredAt ?? current.deliveredAt,
  });

  if (input.warrantyDays !== undefined) {
    updated.warrantyDays = input.warrantyDays;
    updated.warrantyExpiresAt = addDays(current.createdAt, input.warrantyDays);
  }

  store.orders[index] = updated;
  persistStore(store);

  if (updated.status !== "Pagada" && updated.finalTotal > 0 && updated.balanceDue <= 0) {
    return payServiceOrder(orderNumber);
  }

  return updated;
}

export function deleteServiceOrder(orderNumber: string): boolean {
  const store = ensureStore();
  const nextOrders = store.orders.filter((order) => order.orderNumber !== orderNumber);
  if (nextOrders.length === store.orders.length) return false;

  store.orders = nextOrders;
  persistStore(store);
  return true;
}

export function payServiceOrder(orderNumber: string): ServiceOrder | null {
  const store = ensureStore();
  const index = store.orders.findIndex((order) => order.orderNumber === orderNumber);
  if (index === -1) return null;

  const current = withFinancialTotals(store.orders[index]);
  if (current.status === "Pagada" && current.paidAt) {
    const existingRepairSale = getRepairSaleByOrderNumber(current.orderNumber);
    if (existingRepairSale) return current;

    const repairSale = registerRepairSale({
      orderNumber: current.orderNumber,
      clientName: current.clientName,
      total: current.finalTotal,
      createdAt: current.paidAt,
    });
    const repairedPaidOrder: ServiceOrder = {
      ...current,
      saleIds: [...(current.saleIds ?? []), repairSale.id],
      paidAmount: current.finalTotal,
      balanceDue: 0,
      updatedAt: new Date().toISOString(),
    };
    store.orders[index] = repairedPaidOrder;
    persistStore(store);
    return repairedPaidOrder;
  }

  const requiredStock = new Map<string, number>();
  for (const part of current.parts) {
    requiredStock.set(part.productId, (requiredStock.get(part.productId) ?? 0) + part.quantity);
  }

  const products = listInventoryProducts();
  for (const [productId, quantity] of requiredStock) {
    const product = products.find((item) => item.id === productId);
    if (!product) throw new Error("Uno de los repuestos ya no existe en inventario.");
    if (product.stock < quantity) {
      throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}.`);
    }
  }

  const saleIds = current.parts.map((part) => {
    const sale = registerInventorySale({
      productId: part.productId,
      quantity: part.quantity,
      unitPrice: part.unitPrice,
      source: "service-order-part",
      orderNumber: current.orderNumber,
    });
    return sale.id;
  });

  const now = new Date().toISOString();
  const repairSale = registerRepairSale({
    orderNumber: current.orderNumber,
    clientName: current.clientName,
    total: current.finalTotal,
    createdAt: now,
  });

  const paidOrder: ServiceOrder = {
    ...current,
    status: "Pagada",
    paidAt: now,
    deliveredAt: current.deliveredAt ?? now,
    updatedAt: now,
    saleIds: [...saleIds, repairSale.id],
    finalPayment: Math.max(current.finalPayment ?? 0, current.finalTotal - (current.advance ?? 0)),
    paidAmount: current.finalTotal,
    balanceDue: 0,
    statusHistory: appendStatusHistory(current.statusHistory, "Pagada", now),
  };

  store.orders[index] = paidOrder;
  persistStore(store);
  return paidOrder;
}

export function isValidRepairStatus(value: string): value is RepairStatus {
  return [
    "Recibido",
    "Diagnóstico",
    "En reparación",
    "Listo",
    "Entregado",
    "Pagada",
  ].includes(value);
}

export function validateCreateInput(body: unknown): CreateServiceOrderInput | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Cuerpo de solicitud inválido." };
  }

  const data = body as Record<string, unknown>;
  const requiredStrings = [
    "clientName",
    "clientPhone",
    "brand",
    "model",
    "color",
    "reportedDamage",
    "physicalCondition",
  ] as const;

  for (const field of requiredStrings) {
    if (typeof data[field] !== "string" || !data[field].trim()) {
      return { error: `El campo ${field} es requerido.` };
    }
  }

  const status = typeof data.status === "string" ? data.status : "Recibido";
  if (!isValidRepairStatus(status)) {
    return { error: "Estado de reparación inválido." };
  }

  const accessories = Array.isArray(data.accessories)
    ? data.accessories.filter((item): item is string => typeof item === "string")
    : [];

  const estimatedValue =
    data.estimatedValue === undefined || data.estimatedValue === null || data.estimatedValue === ""
      ? undefined
      : Number(data.estimatedValue);

  if (estimatedValue !== undefined && Number.isNaN(estimatedValue)) {
    return { error: "Valor estimado inválido." };
  }

  return {
    clientName: data.clientName as string,
    clientPhone: data.clientPhone as string,
    clientId: typeof data.clientId === "string" ? data.clientId : undefined,
    brand: data.brand as string,
    model: data.model as string,
    imei: typeof data.imei === "string" ? data.imei : undefined,
    color: data.color as string,
    reportedDamage: data.reportedDamage as string,
    technicalDiagnosis:
      typeof data.technicalDiagnosis === "string" ? data.technicalDiagnosis : undefined,
    accessories,
    physicalCondition: data.physicalCondition as string,
    observations: typeof data.observations === "string" ? data.observations : "",
    estimatedValue,
    laborCost: toMoney(data.laborCost),
    parts: Array.isArray(data.parts) ? (data.parts as ServiceOrderPart[]) : [],
    discount: toMoney(data.discount),
    advance: toMoney(data.advance),
    finalPayment: toMoney(data.finalPayment),
    status,
    technicianName: typeof data.technicianName === "string" ? data.technicianName : undefined,
    warrantyDays:
      typeof data.warrantyDays === "number" && !Number.isNaN(data.warrantyDays)
        ? data.warrantyDays
        : undefined,
  };
}
