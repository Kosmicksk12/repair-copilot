import {
  mockCustomerResults,
  mockKnowledgeResults,
  mockWarrantyResults,
} from "./mock-data";
import { listInventoryProducts } from "../../inventory-store";
import type { InventoryProduct } from "../../inventory-types";
import { listServiceOrders } from "../../service-orders-store";
import type { ServiceOrder } from "../../service-order-types";
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
  color?: string;
  tipoResultado?: "product" | "type";
  requiereMarca?: boolean;
  marcasDisponibles?: string[];
};

export type ServiceOrderSearchResult = {
  numeroOrden: string;
  cliente: string;
  equipo: string;
  estado: string;
  fecha: string;
};

function normalizeSearchText(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function tokenizeSearch(value: string | undefined): string[] {
  return normalizeSearchText(value)
    .split(/[^a-z0-9-]+/)
    .filter((token) => token.length >= 2);
}

const PRODUCT_KEYWORDS = [
  { category: "Cargadores", terms: ["cargador", "cargadores", "carga", "cabeza", "cubo"] },
  { category: "Cables", terms: ["cable", "cables", "lightning", "usb", "usb-c", "tipo c", "v8", "micro usb"] },
  { category: "Forros", terms: ["forro", "forros", "funda", "case", "protector"] },
  { category: "Audifonos", terms: ["audifono", "audifonos", "auricular", "auriculares", "manos libres", "bluetooth"] },
] as const;

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function findIncludedValue(query: string, values: string[]) {
  return values
    .map((value) => ({ raw: value, normalized: normalizeSearchText(value) }))
    .filter((value) => value.normalized && query.includes(value.normalized))
    .sort((a, b) => b.normalized.length - a.normalized.length)[0]?.raw;
}

function detectCategory(query: string) {
  return PRODUCT_KEYWORDS.find((entry) => entry.terms.some((term) => query.includes(normalizeSearchText(term))))?.category;
}

function detectAttributes(query: string, products: InventoryProduct[]) {
  const scopedProducts = detectCategory(query)
    ? products.filter((product) => product.category === detectCategory(query))
    : products;

  return {
    category: detectCategory(query),
    brand: findIncludedValue(query, unique(scopedProducts.map((product) => product.brand))),
    model: findIncludedValue(query, unique(scopedProducts.flatMap((product) => [product.model, product.name].filter(Boolean) as string[]))),
    color: findIncludedValue(query, unique(scopedProducts.flatMap((product) => [product.color, product.boxColor].filter(Boolean) as string[]))),
  };
}

function productMatchesAttributes(product: InventoryProduct, attributes: ReturnType<typeof detectAttributes>) {
  if (attributes.category && product.category !== attributes.category) return false;
  if (attributes.brand && normalizeSearchText(product.brand) !== normalizeSearchText(attributes.brand)) return false;
  if (attributes.model) {
    const model = normalizeSearchText(attributes.model);
    const productModel = normalizeSearchText(product.model);
    const productName = normalizeSearchText(product.name);
    if (!productModel.includes(model) && !productName.includes(model)) return false;
  }
  if (attributes.color) {
    const color = normalizeSearchText(attributes.color);
    const productColor = normalizeSearchText(product.color);
    const boxColor = normalizeSearchText(product.boxColor);
    if (!productColor.includes(color) && !boxColor.includes(color)) return false;
  }
  return true;
}

function toInventorySearchResult(product: InventoryProduct): InventorySearchResult {
  return {
    nombre: product.name,
    categoria: product.category,
    marca: product.brand,
    modelo: product.model ?? product.variant ?? "",
    precioVenta: product.salePrice,
    stock: product.stock,
    color: product.color,
    tipoResultado: "product",
  };
}

function summarizeProductTypes(products: InventoryProduct[], limit: number): InventorySearchResult[] {
  const groups = new Map<string, InventoryProduct[]>();

  for (const product of products) {
    const label = product.variant || product.name;
    const key = normalizeSearchText(label);
    groups.set(key, [...(groups.get(key) ?? []), product]);
  }

  return [...groups.values()]
    .map((group) => {
      const first = group[0];
      const salePrices = group.map((product) => product.salePrice).filter((price): price is number => typeof price === "number");
      return {
        nombre: first.variant || first.name,
        categoria: first.category,
        marca: "Varias marcas",
        modelo: first.connector ?? first.model ?? "",
        precioVenta: salePrices.length > 0 ? Math.min(...salePrices) : undefined,
        stock: group.reduce((total, product) => total + product.stock, 0),
        color: undefined,
        tipoResultado: "type" as const,
        requiereMarca: true,
        marcasDisponibles: unique(group.map((product) => product.brand)).slice(0, 6),
      };
    })
    .sort((a, b) => b.stock - a.stock || a.nombre.localeCompare(b.nombre))
    .slice(0, limit);
}

function orderText(order: ServiceOrder) {
  return normalizeSearchText([
    order.orderNumber,
    order.clientName,
    order.brand,
    order.model,
  ].join(" "));
}

function matchesOrderQuery(order: ServiceOrder, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const orderNumber = normalizeSearchText(order.orderNumber);

  if (!normalizedQuery) return true;
  if (orderNumber.includes(normalizedQuery)) return true;

  const ignoredTokens = new Set(["orden", "servicio", "cliente", "equipo", "modelo", "buscar", "consulta", "estado"]);
  const tokens = tokenizeSearch(query).filter((token) => !ignoredTokens.has(token));
  if (tokens.length === 0) return false;

  const text = orderText(order);
  return tokens.every((token) => text.includes(token));
}

function toServiceOrderSearchResult(order: ServiceOrder): ServiceOrderSearchResult {
  return {
    numeroOrden: order.orderNumber,
    cliente: order.clientName,
    equipo: [order.brand, order.model].filter(Boolean).join(" "),
    estado: order.status,
    fecha: order.createdAt,
  };
}

export const searchInventory: CopilotToolDefinition<SearchToolInput, InventorySearchResult[]> = {
  name: "searchInventory",
  description: "Busca repuestos o productos en el inventario local por nombre, categoría, marca o modelo.",
  category: "search",
  async execute(input) {
    const query = normalizeSearchText(input?.query);
    const limit = typeof input?.limit === "number" && input.limit > 0 ? Math.trunc(input.limit) : 5;
    const products = listInventoryProducts();
    const attributes = detectAttributes(query, products);
    const matchedProducts = products
      .filter((product) => productMatchesAttributes(product, attributes));
    const shouldShowTypes = Boolean(attributes.category && !attributes.brand && !attributes.model && !attributes.color);
    const data = shouldShowTypes
      ? summarizeProductTypes(matchedProducts, limit)
      : matchedProducts
      .slice(0, limit)
      .map(toInventorySearchResult);

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

export const searchOrder: CopilotToolDefinition<SearchToolInput, ServiceOrderSearchResult[]> = {
  name: "searchOrder",
  description: "Busca órdenes de servicio locales por número, cliente, equipo o modelo.",
  category: "search",
  async execute(input) {
    const query = input?.query ?? "";
    const limit = typeof input?.limit === "number" && input.limit > 0 ? Math.trunc(input.limit) : 5;
    const data = listServiceOrders()
      .filter((order) => matchesOrderQuery(order, query))
      .slice(0, limit)
      .map(toServiceOrderSearchResult);

    return {
      ok: true,
      tool: "searchOrder",
      data,
      message: "Órdenes locales consultadas correctamente.",
      meta: {
        mocked: false,
        executedAt: new Date().toISOString(),
      },
    };
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
