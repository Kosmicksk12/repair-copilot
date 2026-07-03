export const INVENTORY_CATEGORIES = ["Audifonos", "Cables", "Cargadores", "Forros"] as const;

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export type InventoryProduct = {
  id: string;
  category: InventoryCategory;
  name: string;
  brand: string;
  model?: string;
  variant?: string;
  color?: string;
  connector?: string;
  boxColor?: string;
  visualLocation?: string;
  purchasePrice?: number;
  salePrice?: number;
  minimumPrice?: number;
  observations?: string;
  stock: number;
  lowStockThreshold: number;
  sourceCatalog?: string;
  sourceKey?: string;
  originalColumns?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type InventoryProductInput = Omit<
  InventoryProduct,
  "id" | "createdAt" | "updatedAt" | "sourceKey" | "sourceCatalog" | "originalColumns"
> & {
  sourceCatalog?: string;
  sourceKey?: string;
  originalColumns?: Record<string, string>;
};

export type InventoryStore = {
  products: InventoryProduct[];
};

export type InventoryImportSummary = {
  catalogType: InventoryCategory;
  fileName: string;
  processedRows: number;
  added: number;
  updated: number;
  skipped: number;
};
