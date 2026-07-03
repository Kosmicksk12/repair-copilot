export type ConversationStatus = "active" | "archived";

export type Conversation = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  status: ConversationStatus;
  messages: ChatMessage[];
};

export type InventoryMessageData = {
  id: string;
  name: string;
  sku: string;
  compatibility: string;
  stock: number;
  price: number;
  location: string;
};

export type CustomerMessageData = {
  id: string;
  name: string;
  phone: string;
  visits: number;
  lastVisit: string;
  label: string;
};

export type OrderMessageData = {
  orderNumber: string;
  device: string;
  service: string;
  estimatedValue: number;
  estimatedTime: string;
  status: string;
};

export type WarrantyMessageData = {
  title: string;
  coverage: string;
  duration: string;
  exclusions: string[];
};

export type KnowledgeMessageData = {
  eyebrow: string;
  title: string;
  summary: string;
  source: string;
  confidence: "Alta" | "Media" | "Baja";
};

export type ActionOption = {
  id: string;
  label: string;
  variant?: "primary" | "secondary";
};

export type ActionMessageData = {
  title: string;
  description: string;
  actions: ActionOption[];
};

export type AlertMessageData = {
  tone: "success" | "warning" | "info";
  title: string;
  description: string;
};

type BaseMessage = {
  id: string;
  role: "user" | "assistant";
  createdAt: string;
};

export type ChatMessage =
  | (BaseMessage & { type: "text"; content: string })
  | (BaseMessage & { type: "inventory"; data: InventoryMessageData })
  | (BaseMessage & { type: "customer"; data: CustomerMessageData })
  | (BaseMessage & { type: "order"; data: OrderMessageData })
  | (BaseMessage & { type: "warranty"; data: WarrantyMessageData })
  | (BaseMessage & { type: "knowledge"; data: KnowledgeMessageData })
  | (BaseMessage & { type: "action"; data: ActionMessageData })
  | (BaseMessage & { type: "alert"; data: AlertMessageData });

export type SuggestionSet = {
  id: string;
  options: string[];
};

export type DemoStage = "device" | "issue" | "customer" | "ready";

export type MessageActionHandler = (actionId: string) => void;
