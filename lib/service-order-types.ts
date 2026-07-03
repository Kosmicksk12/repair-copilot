export const REPAIR_STATUSES = [
  "Recibido",
  "Diagnóstico",
  "En reparación",
  "Listo",
  "Entregado",
] as const;

export type RepairStatus = (typeof REPAIR_STATUSES)[number];

export const ACCESSORY_OPTIONS = [
  "SIM",
  "Memoria SD",
  "Cargador",
  "Forro",
  "Cable",
  "Auriculares",
  "Estuche",
] as const;

export type AccessoryOption = (typeof ACCESSORY_OPTIONS)[number];

export type ServiceOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  clientName: string;
  clientPhone: string;
  clientId?: string;
  brand: string;
  model: string;
  imei?: string;
  color: string;
  reportedDamage: string;
  technicalDiagnosis?: string;
  accessories: string[];
  physicalCondition: string;
  observations: string;
  estimatedValue?: number;
  status: RepairStatus;
  technicianName?: string;
  warrantyDays?: number;
  warrantyExpiresAt?: string;
  deliveredAt?: string;
};

export type CreateServiceOrderInput = Omit<
  ServiceOrder,
  "id" | "orderNumber" | "createdAt" | "updatedAt" | "warrantyExpiresAt" | "deliveredAt"
> & {
  warrantyDays?: number;
};

export type UpdateServiceOrderInput = Partial<
  Omit<ServiceOrder, "id" | "orderNumber" | "createdAt">
>;

export type PublicOrderStatus = {
  orderNumber: string;
  status: RepairStatus;
  createdAt: string;
  updatedAt: string;
  brand: string;
  model: string;
  clientNameMasked: string;
  warrantyActive: boolean;
  warrantyExpiresAt?: string;
  publicUrl: string;
};

export type ServiceOrderStore = {
  lastSequence: number;
  orders: ServiceOrder[];
};

export type ServiceOrderListFilters = {
  status?: RepairStatus;
  search?: string;
  clientPhone?: string;
};
