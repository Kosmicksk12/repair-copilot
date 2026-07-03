export const mockCustomerResults = [
  {
    id: "cli-0194",
    name: "Laura Martínez",
    phone: "+57 300 248 7190",
    visits: 3,
    lastVisit: "12 de mayo de 2026",
    label: "Cliente frecuente",
  },
];

export const mockOrderResults = [
  {
    id: "ord-demo-001",
    orderNumber: "BORRADOR",
    device: "Apple iPhone 13",
    service: "Diagnóstico y cambio de batería",
    estimatedValue: 249000,
    estimatedTime: "45–60 minutos",
    status: "Lista para crear",
  },
];

export const mockWarrantyResults = [
  {
    id: "war-bat-001",
    title: "Garantía sugerida para batería",
    coverage: "Defectos de fabricación y rendimiento inferior al 80%.",
    duration: "60 días",
    exclusions: ["Golpes o humedad", "Cargadores no certificados"],
  },
];

export const mockKnowledgeResults = [
  {
    id: "kb-battery-precheck",
    eyebrow: "Procedimiento recomendado",
    title: "Validación previa al cambio de batería",
    summary: "Confirma salud de batería, ciclos de carga y consumo en reposo antes de autorizar el repuesto.",
    source: "Base de conocimiento · Baterías",
    confidence: "Alta",
  },
];

export const mockCreatedOrder = {
  id: "ord-demo-created",
  orderNumber: "DEMO-0001",
  status: "Borrador creado en modo mock",
};

export const mockUpdatedOrder = {
  id: "ord-demo-001",
  orderNumber: "BORRADOR",
  status: "Actualizado en modo mock",
};

export const mockRegisteredSale = {
  id: "sale-demo-001",
  receiptNumber: "SALE-DEMO-0001",
  status: "Venta registrada en modo mock",
};

export const mockUpdatedStock = {
  sku: "BAT-IP13-PM",
  previousStock: 7,
  currentStock: 6,
  status: "Stock actualizado en modo mock",
};
