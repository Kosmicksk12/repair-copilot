import {
  mockCreatedOrder,
  mockRegisteredSale,
  mockUpdatedOrder,
  mockUpdatedStock,
} from "./mock-data";
import type { CopilotToolDefinition, CopilotToolInput } from "./types";
import { createMockToolResult } from "./utils";

export type MutationToolInput = CopilotToolInput & {
  id?: string;
  payload?: Record<string, unknown>;
};

export const createOrder: CopilotToolDefinition<MutationToolInput, typeof mockCreatedOrder> = {
  name: "createOrder",
  description: "Prepara la creación de una orden. Actualmente devuelve una orden mock.",
  category: "mutation",
  async execute() {
    return createMockToolResult("createOrder", mockCreatedOrder, "Orden mock creada correctamente.");
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

export const registerSale: CopilotToolDefinition<MutationToolInput, typeof mockRegisteredSale> = {
  name: "registerSale",
  description: "Prepara el registro de una venta. Actualmente devuelve una venta mock.",
  category: "mutation",
  async execute() {
    return createMockToolResult("registerSale", mockRegisteredSale, "Venta mock registrada correctamente.");
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
