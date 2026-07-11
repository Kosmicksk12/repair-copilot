export type SaleRecord = {
  id: string;
  createdAt: string;
  productId?: string;
  productName?: string;
  productCategory?: string;
  productBrand?: string;
  productModel?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  source?: "quick-sale" | "service-order-part" | "service-order-repair";
  type?: "accesorio" | "repuesto" | "reparación";
  orderNumber?: string;
  clientName?: string;
};

export type SalesStore = {
  sales: SaleRecord[];
};

export type RegisterSaleInput = {
  productId: string;
  quantity: number;
  unitPrice?: number;
  source?: "quick-sale" | "service-order-part";
  orderNumber?: string;
};

export type RegisterRepairSaleInput = {
  orderNumber: string;
  clientName: string;
  total: number;
  createdAt?: string;
};

export type MonthlySalesSummary = {
  month: number;
  year: number;
  monthKey: string;
  totalSold: number;
  totalRepairs: number;
  totalAccessories: number;
  repairsCount: number;
  accessoriesCount: number;
  salesCount: number;
};
