import type { InventoryProduct } from "./inventory-types";
import type { SaleRecord } from "./sales-types";
import type { ServiceOrder } from "./service-order-types";

export type CustomerRepairHistoryItem = {
  orderNumber: string;
  createdAt: string;
  deliveredAt?: string;
  paidAt?: string;
  equipment: string;
  status: string;
  total: number;
  warrantyExpiresAt?: string;
};

export type CustomerPurchaseHistoryItem = {
  id: string;
  createdAt: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type CustomerWarrantyHistoryItem = {
  orderNumber: string;
  equipment: string;
  warrantyDays?: number;
  warrantyExpiresAt?: string;
  active: boolean;
};

export type CustomerDeviceItem = {
  key: string;
  brand: string;
  model: string;
  imei?: string;
  color?: string;
  lastSeenAt: string;
};

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  lastVisit?: string;
  totalSpent: number;
  repairCount: number;
  purchaseCount: number;
  activeWarrantyCount: number;
  repairs: CustomerRepairHistoryItem[];
  purchases: CustomerPurchaseHistoryItem[];
  warranties: CustomerWarrantyHistoryItem[];
  devices: CustomerDeviceItem[];
};

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function customerKey(name: string, phone?: string) {
  const normalizedPhone = phone?.replace(/\D/g, "");
  return normalizedPhone ? `phone:${normalizedPhone}` : `name:${normalizeText(name)}`;
}

function maxIsoDate(values: Array<string | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];
}

function equipmentName(order: ServiceOrder) {
  return [order.brand, order.model].filter(Boolean).join(" ");
}

function saleMatchesCustomer(sale: SaleRecord, profile: CustomerProfile, orderNumbers: Set<string>) {
  if (sale.orderNumber && orderNumbers.has(sale.orderNumber)) return true;
  return Boolean(sale.clientName && normalizeText(sale.clientName) === normalizeText(profile.name));
}

function saleProductName(sale: SaleRecord, products: InventoryProduct[]) {
  if (sale.productName) return sale.productName;
  const product = sale.productId ? products.find((item) => item.id === sale.productId) : undefined;
  return product?.name ?? sale.type ?? "Compra";
}

export function buildCustomerProfiles(
  orders: ServiceOrder[],
  sales: SaleRecord[],
  products: InventoryProduct[],
  now = new Date(),
): CustomerProfile[] {
  const profiles = new Map<string, CustomerProfile>();

  for (const order of orders) {
    const key = customerKey(order.clientName, order.clientPhone);
    const profile = profiles.get(key) ?? {
      id: key,
      name: order.clientName,
      phone: order.clientPhone,
      totalSpent: 0,
      repairCount: 0,
      purchaseCount: 0,
      activeWarrantyCount: 0,
      repairs: [],
      purchases: [],
      warranties: [],
      devices: [],
    };

    profile.repairs.push({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt,
      paidAt: order.paidAt,
      equipment: equipmentName(order),
      status: order.status,
      total: order.finalTotal,
      warrantyExpiresAt: order.warrantyExpiresAt,
    });

    const warrantyActive = order.warrantyExpiresAt
      ? new Date(order.warrantyExpiresAt).getTime() > now.getTime()
      : false;
    profile.warranties.push({
      orderNumber: order.orderNumber,
      equipment: equipmentName(order),
      warrantyDays: order.warrantyDays,
      warrantyExpiresAt: order.warrantyExpiresAt,
      active: warrantyActive,
    });

    const deviceKey = [order.brand, order.model, order.imei ?? "", order.color].join("|");
    const existingDevice = profile.devices.find((device) => device.key === deviceKey);
    const lastSeenAt = maxIsoDate([order.updatedAt, order.deliveredAt, order.paidAt, order.createdAt]) ?? order.createdAt;
    if (existingDevice) {
      existingDevice.lastSeenAt = maxIsoDate([existingDevice.lastSeenAt, lastSeenAt]) ?? existingDevice.lastSeenAt;
    } else {
      profile.devices.push({
        key: deviceKey,
        brand: order.brand,
        model: order.model,
        imei: order.imei,
        color: order.color,
        lastSeenAt,
      });
    }

    profiles.set(key, profile);
  }

  for (const profile of profiles.values()) {
    const orderNumbers = new Set(profile.repairs.map((repair) => repair.orderNumber));
    const customerSales = sales.filter((sale) => saleMatchesCustomer(sale, profile, orderNumbers));

    const repairSales = customerSales.filter((sale) => sale.source === "service-order-repair" || sale.type === "reparación");
    const quickPurchases = customerSales.filter((sale) => {
      if (sale.source === "service-order-repair" || sale.type === "reparación") return false;
      if (sale.source === "service-order-part") return false;
      return true;
    });

    profile.purchases = quickPurchases.map((sale) => ({
      id: sale.id,
      createdAt: sale.createdAt,
      productName: saleProductName(sale, products),
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      total: sale.total,
    }));

    profile.totalSpent =
      repairSales.reduce((total, sale) => total + sale.total, 0) +
      quickPurchases.reduce((total, sale) => total + sale.total, 0);
    profile.repairCount = profile.repairs.length;
    profile.purchaseCount = profile.purchases.length;
    profile.activeWarrantyCount = profile.warranties.filter((warranty) => warranty.active).length;
    profile.lastVisit = maxIsoDate([
      ...profile.repairs.map((repair) => repair.paidAt ?? repair.deliveredAt ?? repair.createdAt),
      ...profile.purchases.map((purchase) => purchase.createdAt),
    ]);

    profile.repairs.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    profile.purchases.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    profile.warranties.sort((left, right) => {
      const leftTime = left.warrantyExpiresAt ? new Date(left.warrantyExpiresAt).getTime() : 0;
      const rightTime = right.warrantyExpiresAt ? new Date(right.warrantyExpiresAt).getTime() : 0;
      return rightTime - leftTime;
    });
    profile.devices.sort((left, right) => new Date(right.lastSeenAt).getTime() - new Date(left.lastSeenAt).getTime());
  }

  return [...profiles.values()].sort((left, right) => {
    const leftTime = left.lastVisit ? new Date(left.lastVisit).getTime() : 0;
    const rightTime = right.lastVisit ? new Date(right.lastVisit).getTime() : 0;
    return rightTime - leftTime || left.name.localeCompare(right.name);
  });
}
