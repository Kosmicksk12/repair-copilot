import {
  mockCustomerResults,
  mockKnowledgeResults,
  mockOrderResults,
  mockWarrantyResults,
} from "./mock-data";
import { listInventoryProducts } from "../../inventory-store";
import type { CopilotToolDefinition, CopilotToolInput } from "./types";
import { createMockToolResult } from "./utils";

export type SearchToolInput = CopilotToolInput & {
  query?: string;
  limit?: number;
};

export type InventorySearchResult = {
  nombre: string;
  categoria: string;
  marca: string;
  modelo: string;
  precioVenta?: number;
  stock: number;
};

function normalizeSearchText(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function matchesInventoryQuery(product: ReturnType<typeof listInventoryProducts>[number], query: string): boolean {
  if (!query) return true;

  return [
    product.name,
    product.category,
    product.brand,
    product.model,
  ].some((value) => normalizeSearchText(value).includes(query));
}

export const searchInventory: CopilotToolDefinition<SearchToolInput, InventorySearchResult[]> = {
  name: "searchInventory",
  description: "Busca repuestos o productos en el inventario local por nombre, categoría, marca o modelo.",
  category: "search",
  async execute(input) {
    const query = normalizeSearchText(input?.query);
    const limit = typeof input?.limit === "number" && input.limit > 0 ? Math.trunc(input.limit) : 10;
    const data = listInventoryProducts()
      .filter((product) => matchesInventoryQuery(product, query))
      .slice(0, limit)
      .map((product) => ({
        nombre: product.name,
        categoria: product.category,
        marca: product.brand,
        modelo: product.model ?? "",
        precioVenta: product.salePrice,
        stock: product.stock,
      }));

    return {
      ok: true,
      tool: "searchInventory",
      data,
      message: "Inventario local consultado correctamente.",
      meta: {
        mocked: false,
        executedAt: new Date().toISOString(),
      },
    };
  },
};

export const searchCustomer: CopilotToolDefinition<SearchToolInput, typeof mockCustomerResults> = {
  name: "searchCustomer",
  description: "Busca clientes existentes. Actualmente devuelve datos mock.",
  category: "search",
  async execute() {
    return createMockToolResult("searchCustomer", mockCustomerResults, "Clientes mock consultados correctamente.");
  },
};

export const searchOrder: CopilotToolDefinition<SearchToolInput, typeof mockOrderResults> = {
  name: "searchOrder",
  description: "Busca órdenes de servicio. Actualmente devuelve datos mock.",
  category: "search",
  async execute() {
    return createMockToolResult("searchOrder", mockOrderResults, "Órdenes mock consultadas correctamente.");
  },
};

export const searchWarranty: CopilotToolDefinition<SearchToolInput, typeof mockWarrantyResults> = {
  name: "searchWarranty",
  description: "Busca condiciones o registros de garantía. Actualmente devuelve datos mock.",
  category: "search",
  async execute() {
    return createMockToolResult("searchWarranty", mockWarrantyResults, "Garantías mock consultadas correctamente.");
  },
};

export const searchKnowledge: CopilotToolDefinition<SearchToolInput, typeof mockKnowledgeResults> = {
  name: "searchKnowledge",
  description: "Busca artículos de conocimiento técnico. Actualmente devuelve datos mock.",
  category: "search",
  async execute() {
    return createMockToolResult("searchKnowledge", mockKnowledgeResults, "Conocimiento mock consultado correctamente.");
  },
};

export const searchTools = [
  searchInventory,
  searchCustomer,
  searchOrder,
  searchWarranty,
  searchKnowledge,
];
