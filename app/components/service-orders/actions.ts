"use server";

import {
  createServiceOrder,
  deleteServiceOrder,
  isValidRepairStatus,
  listServiceOrders,
  payServiceOrder,
  updateServiceOrder,
  validateCreateInput,
} from "@/lib/service-orders-store";
import { listInventoryProducts } from "@/lib/inventory-store";
import type { InventoryProduct } from "@/lib/inventory-types";
import type { RepairStatus, ServiceOrder } from "@/lib/service-order-types";

export type ServiceOrderActionPayload = Record<string, unknown>;

export async function getServiceOrdersForModule(filters: {
  search?: string;
  status?: RepairStatus | "Todos";
} = {}): Promise<ServiceOrder[]> {
  return listServiceOrders({
    search: filters.search,
    status: filters.status && filters.status !== "Todos" ? filters.status : undefined,
  });
}

export async function getAvailablePartsForModule(): Promise<InventoryProduct[]> {
  return listInventoryProducts().filter((product) => product.stock > 0);
}

export async function createServiceOrderForModule(payload: ServiceOrderActionPayload): Promise<ServiceOrder> {
  const validated = validateCreateInput(payload);

  if ("error" in validated) {
    throw new Error(validated.error);
  }

  return createServiceOrder(validated);
}

export async function updateServiceOrderForModule(
  orderNumber: string,
  payload: ServiceOrderActionPayload,
): Promise<ServiceOrder> {
  const status = payload.status;
  if (status !== undefined && (typeof status !== "string" || !isValidRepairStatus(status))) {
    throw new Error("Estado de reparación inválido.");
  }

  const order = updateServiceOrder(orderNumber, {
    ...payload,
    status: status as RepairStatus | undefined,
    estimatedValue:
      payload.estimatedValue === undefined ||
      payload.estimatedValue === null ||
      payload.estimatedValue === ""
        ? undefined
        : Number(payload.estimatedValue),
    accessories: Array.isArray(payload.accessories)
      ? payload.accessories.filter((item): item is string => typeof item === "string")
      : undefined,
  });

  if (!order) {
    throw new Error("Orden no encontrada.");
  }

  return order;
}

export async function deleteServiceOrderForModule(orderNumber: string): Promise<void> {
  const deleted = deleteServiceOrder(orderNumber);
  if (!deleted) {
    throw new Error("Orden no encontrada.");
  }
}

export async function payServiceOrderForModule(orderNumber: string): Promise<ServiceOrder> {
  const order = payServiceOrder(orderNumber);
  if (!order) {
    throw new Error("Orden no encontrada.");
  }
  return order;
}
