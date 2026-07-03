"use server";

import { toolRouter } from "@/lib/copilot/tools";
import { listInventoryProducts } from "@/lib/inventory-store";
import type { InventoryProduct } from "@/lib/inventory-types";
import { listSales } from "@/lib/sales-store";
import type { SaleRecord } from "@/lib/sales-types";

export type SalesProduct = Pick<
  InventoryProduct,
  "id" | "category" | "name" | "brand" | "model" | "variant" | "color" | "connector" | "boxColor" | "visualLocation" | "salePrice" | "minimumPrice" | "stock"
>;

export type SalesPageData = {
  products: SalesProduct[];
  sales: SaleRecord[];
};

function toSalesProduct(product: InventoryProduct): SalesProduct {
  return {
    id: product.id,
    category: product.category,
    name: product.name,
    brand: product.brand,
    model: product.model,
    variant: product.variant,
    color: product.color,
    connector: product.connector,
    boxColor: product.boxColor,
    visualLocation: product.visualLocation,
    salePrice: product.salePrice,
    minimumPrice: product.minimumPrice,
    stock: product.stock,
  };
}

export async function getSalesPageData(): Promise<SalesPageData> {
  return {
    products: listInventoryProducts().map(toSalesProduct),
    sales: listSales(),
  };
}

export async function registerSaleForPage(productId: string, quantity: number): Promise<SalesPageData & { sale: SaleRecord }> {
  const result = await toolRouter.execute({
    tool: "registerSale",
    input: {
      payload: {
        productId,
        quantity,
      },
    },
  });

  return {
    ...(await getSalesPageData()),
    sale: result.data as SaleRecord,
  };
}
