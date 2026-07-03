export type SaleRecord = {
  id: string;
  createdAt: string;
  productId: string;
  productName: string;
  productCategory: string;
  productBrand: string;
  productModel?: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type SalesStore = {
  sales: SaleRecord[];
};

export type RegisterSaleInput = {
  productId: string;
  quantity: number;
};
