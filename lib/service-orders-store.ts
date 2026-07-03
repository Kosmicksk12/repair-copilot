import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import type {
  CreateServiceOrderInput,
  PublicOrderStatus,
  RepairStatus,
  ServiceOrder,
  ServiceOrderListFilters,
  ServiceOrderStore,
  UpdateServiceOrderInput,
} from "./service-order-types";
import { DEFAULT_WARRANTY_DAYS } from "./warranty-terms";

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
  let orders = [...store.orders].sort(
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
  return store.orders.find((order) => order.orderNumber === orderNumber) ?? null;
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

  const order: ServiceOrder = {
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
    status: input.status,
    technicianName: input.technicianName?.trim() || undefined,
    warrantyDays,
    warrantyExpiresAt: addDays(now, warrantyDays),
  };

  store.lastSequence = nextSequence;
  store.orders.unshift(order);
  persistStore(store);

  return order;
}

export function updateServiceOrder(
  orderNumber: string,
  input: UpdateServiceOrderInput,
): ServiceOrder | null {
  const store = ensureStore();
  const index = store.orders.findIndex((order) => order.orderNumber === orderNumber);

  if (index === -1) return null;

  const current = store.orders[index];
  const now = new Date().toISOString();
  const nextStatus = input.status ?? current.status;

  const updated: ServiceOrder = {
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
    technicianName:
      input.technicianName !== undefined
        ? input.technicianName.trim() || undefined
        : current.technicianName,
    updatedAt: now,
    deliveredAt:
      nextStatus === "Entregado" && !current.deliveredAt
        ? now
        : input.deliveredAt ?? current.deliveredAt,
  };

  if (input.warrantyDays !== undefined) {
    updated.warrantyDays = input.warrantyDays;
    updated.warrantyExpiresAt = addDays(current.createdAt, input.warrantyDays);
  }

  store.orders[index] = updated;
  persistStore(store);

  return updated;
}

export function isValidRepairStatus(value: string): value is RepairStatus {
  return [
    "Recibido",
    "Diagnóstico",
    "En reparación",
    "Listo",
    "Entregado",
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
    status,
    technicianName: typeof data.technicianName === "string" ? data.technicianName : undefined,
    warrantyDays:
      typeof data.warrantyDays === "number" && !Number.isNaN(data.warrantyDays)
        ? data.warrantyDays
        : undefined,
  };
}
