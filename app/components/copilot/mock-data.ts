import type {
  ChatMessage,
  Conversation,
  CustomerMessageData,
  InventoryMessageData,
  KnowledgeMessageData,
  OrderMessageData,
  WarrantyMessageData,
} from "./types";

export const mockInventory: InventoryMessageData = {
  id: "inv-bat-13",
  name: "Batería premium iPhone 13",
  sku: "BAT-IP13-PM",
  compatibility: "iPhone 13 · A2633 / A2482",
  stock: 7,
  price: 189000,
  location: "Vitrina B · Nivel 2",
};

export const mockCustomer: CustomerMessageData = {
  id: "cli-0194",
  name: "Laura Martínez",
  phone: "+57 300 248 7190",
  visits: 3,
  lastVisit: "12 de mayo de 2026",
  label: "Cliente frecuente",
};

export const mockOrder: OrderMessageData = {
  orderNumber: "BORRADOR",
  device: "Apple iPhone 13",
  service: "Diagnóstico y cambio de batería",
  estimatedValue: 249000,
  estimatedTime: "45–60 minutos",
  status: "Lista para crear",
};

export const mockWarranty: WarrantyMessageData = {
  title: "Garantía sugerida para batería",
  coverage: "Defectos de fabricación y rendimiento inferior al 80%.",
  duration: "60 días",
  exclusions: ["Golpes o humedad", "Cargadores no certificados"],
};

export const mockKnowledge: KnowledgeMessageData = {
  eyebrow: "Procedimiento recomendado",
  title: "Validación previa al cambio de batería",
  summary:
    "Confirma salud de batería, ciclos de carga y consumo en reposo antes de autorizar el repuesto.",
  source: "Base de conocimiento · Baterías",
  confidence: "Alta",
};

const now = "10:32";

export const welcomeMessages: ChatMessage[] = [
  {
    id: "welcome-1",
    role: "assistant",
    type: "text",
    content:
      "Hola, soy RepairCopilot. Cuéntame qué equipo tienes y te ayudo a preparar el siguiente paso.",
    createdAt: now,
  },
];

export const mockConversations: Conversation[] = [
  {
    id: "demo-iphone-13",
    title: "Batería · iPhone 13",
    preview: "Tengo un iPhone 13.",
    updatedAt: "Ahora",
    status: "active",
    messages: welcomeMessages,
  },
  {
    id: "screen-galaxy",
    title: "Pantalla · Galaxy S23",
    preview: "La pantalla parpadea después de una caída.",
    updatedAt: "Ayer",
    status: "active",
    messages: [
      {
        id: "galaxy-1",
        role: "user",
        type: "text",
        content: "La pantalla de mi Galaxy S23 parpadea después de una caída.",
        createdAt: "16:42",
      },
      {
        id: "galaxy-2",
        role: "assistant",
        type: "knowledge",
        data: {
          eyebrow: "Revisión técnica",
          title: "Impacto con falla intermitente de pantalla",
          summary:
            "Conviene validar flex, marco y respuesta táctil antes de cotizar el módulo completo.",
          source: "Base de conocimiento · Pantallas",
          confidence: "Media",
        },
        createdAt: "16:43",
      },
    ],
  },
  {
    id: "warranty-iphone-12",
    title: "Garantía · iPhone 12",
    preview: "Consulta sobre garantía de pantalla.",
    updatedAt: "28 jun",
    status: "active",
    messages: [
      {
        id: "warranty-1",
        role: "user",
        type: "text",
        content: "¿Mi cambio de pantalla todavía tiene garantía?",
        createdAt: "09:14",
      },
      {
        id: "warranty-2",
        role: "assistant",
        type: "warranty",
        data: {
          title: "Garantía de pantalla",
          coverage: "Defectos de fabricación del repuesto instalado.",
          duration: "90 días",
          exclusions: ["Daño físico posterior", "Humedad o intervención de terceros"],
        },
        createdAt: "09:14",
      },
    ],
  },
];
