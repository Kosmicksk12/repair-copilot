import {
  mockUpdatedOrder,
  mockUpdatedStock,
} from "./mock-data";
import { createServiceOrder, validateCreateInput } from "../../service-orders-store";
import { registerInventorySale } from "../../sales-store";
import type { SaleRecord } from "../../sales-types";
import type { CopilotToolDefinition, CopilotToolInput } from "./types";
import { createMockToolResult } from "./utils";

export type MutationToolInput = CopilotToolInput & {
  id?: string;
  payload?: Record<string, unknown>;
};

export type CreateOrderToolResult = {
  numeroOrden: string;
  cliente: string;
  equipo: string;
  estadoInicial: string;
  fecha: string;
};

export const createOrder: CopilotToolDefinition<MutationToolInput, CreateOrderToolResult> = {
  name: "createOrder",
  description: "Crea una orden de servicio local reutilizando el módulo existente de órdenes.",
  category: "mutation",
  async execute(input) {
    const validated = validateCreateInput(input?.payload ?? {});

    if ("error" in validated) {
      throw new Error(validated.error);
    }

    const order = createServiceOrder(validated);

    return {
      ok: true,
      tool: "createOrder",
      data: {
        numeroOrden: order.orderNumber,
        cliente: order.clientName,
        equipo: [order.brand, order.model].filter(Boolean).join(" "),
        estadoInicial: order.status,
        fecha: order.createdAt,
      },
      message: "Orden de servicio local creada correctamente.",
      meta: {
        mocked: false,
        executedAt: new Date().toISOString(),
      },
    };
  },
};

export const updateOrder: CopilotToolDefinition<MutationToolInput, typeof mockUpdatedOrder> = {
  name: "updateOrder",
  description: "Prepara la actualización de una orden. Actualmente devuelve una orden mock actualizada.",
  category: "mutation",
  async execute() {
    return createMockToolResult("updateOrder", mockUpdatedOrder, "Orden mock actualizada correctamente.");
  },
};

export const registerSale: CopilotToolDefinition<MutationToolInput, SaleRecord> = {
  name: "registerSale",
  description: "Registra una venta local de inventario y descuenta stock.",
  category: "mutation",
  async execute(input) {
    const productId = typeof input?.payload?.productId === "string" ? input.payload.productId : "";
    const quantity = typeof input?.payload?.quantity === "number" ? input.payload.quantity : Number(input?.payload?.quantity);
    const sale = registerInventorySale({ productId, quantity });

    return {
      ok: true,
      tool: "registerSale",
      data: sale,
      message: "Venta local registrada correctamente.",
      meta: {
        mocked: false,
        executedAt: new Date().toISOString(),
      },
    };
  },
};

export const updateStock: CopilotToolDefinition<MutationToolInput, typeof mockUpdatedStock> = {
  name: "updateStock",
  description: "Prepara la actualización de stock. Actualmente devuelve stock mock actualizado.",
  category: "mutation",
  async execute() {
    return createMockToolResult("updateStock", mockUpdatedStock, "Stock mock actualizado correctamente.");
  },
};

export const mutationTools = [
  createOrder,
  updateOrder,
  registerSale,
  updateStock,
];
