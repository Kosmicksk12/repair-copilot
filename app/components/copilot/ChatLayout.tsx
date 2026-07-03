"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createOrderForCopilot, searchInventoryForCopilot, searchOrdersForCopilot } from "./actions";
import ChatInput from "./ChatInput";
import ConversationHeader from "./ConversationHeader";
import ConversationSidebar from "./ConversationSidebar";
import MessageList from "./MessageList";
import SuggestionChips from "./SuggestionChips";
import {
  mockConversations,
  mockCustomer,
  mockInventory,
  mockKnowledge,
  mockOrder,
  mockWarranty,
  welcomeMessages,
} from "./mock-data";
import type { ChatMessage, Conversation, DemoStage, SuggestionSet } from "./types";

type ServiceOrderDraft = {
  clientName?: string;
  clientPhone?: string;
  brand?: string;
  model?: string;
  color?: string;
  reportedDamage?: string;
  physicalCondition?: string;
};

const REQUIRED_ORDER_FIELDS: Array<keyof ServiceOrderDraft> = [
  "clientName",
  "clientPhone",
  "brand",
  "model",
  "color",
  "reportedDamage",
  "physicalCondition",
];

const ORDER_FIELD_LABELS: Record<keyof ServiceOrderDraft, string> = {
  clientName: "cliente",
  clientPhone: "teléfono",
  brand: "marca",
  model: "modelo",
  color: "color",
  reportedDamage: "daño reportado",
  physicalCondition: "condición física",
};

function currentTime() {
  return new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function normalizeIntent(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isInventoryQuery(content: string) {
  const text = normalizeIntent(content);
  return [
    "inventario",
    "stock",
    "disponible",
    "disponibilidad",
    "repuesto",
    "producto",
    "precio",
    "cargador",
    "cable",
    "forro",
    "audifono",
  ].some((keyword) => text.includes(keyword));
}

function isOrderQuery(content: string) {
  const text = normalizeIntent(content);
  return /\bfp-\d{1,6}\b/.test(text) || [
    "orden",
    "ordenes",
    "servicio",
    "reparacion",
    "cliente",
    "equipo",
    "estado",
  ].some((keyword) => text.includes(keyword));
}

function isCreateOrderIntent(content: string) {
  const text = normalizeIntent(content);
  return [
    "crear orden",
    "nueva orden",
    "registrar orden",
    "abrir orden",
    "generar orden",
    "crear servicio",
  ].some((keyword) => text.includes(keyword));
}

function extractLabeledValue(content: string, labels: string[]) {
  const labelPattern = labels.join("|");
  const nextLabels = [
    "cliente",
    "nombre",
    "telefono",
    "teléfono",
    "celular",
    "marca",
    "modelo",
    "equipo",
    "color",
    "dano",
    "daño",
    "problema",
    "falla",
    "condicion",
    "condición",
    "estado fisico",
    "estado físico",
  ].join("|");
  const match = content.match(new RegExp(`(?:${labelPattern})\\s*[:=-]?\\s*(.+?)(?=\\s+(?:${nextLabels})\\s*[:=-]?|$)`, "i"));
  return match?.[1]?.trim();
}

function parseOrderDraft(content: string): ServiceOrderDraft {
  const phone = content.match(/(?:\+?\d[\d\s-]{6,}\d)/)?.[0]?.replace(/\s+/g, " ").trim();
  return {
    clientName: extractLabeledValue(content, ["cliente", "nombre"]),
    clientPhone: extractLabeledValue(content, ["telefono", "teléfono", "celular"]) ?? phone,
    brand: extractLabeledValue(content, ["marca"]),
    model: extractLabeledValue(content, ["modelo", "equipo"]),
    color: extractLabeledValue(content, ["color"]),
    reportedDamage: extractLabeledValue(content, ["dano", "daño", "problema", "falla"]),
    physicalCondition: extractLabeledValue(content, ["condicion", "condición", "estado fisico", "estado físico"]),
  };
}

function mergeOrderDraft(current: ServiceOrderDraft | undefined, next: ServiceOrderDraft) {
  return Object.fromEntries(
    Object.entries({ ...(current ?? {}), ...next }).filter(([, value]) => typeof value === "string" && value.trim()),
  ) as ServiceOrderDraft;
}

function missingOrderFields(draft: ServiceOrderDraft) {
  return REQUIRED_ORDER_FIELDS.filter((field) => !draft[field]?.trim());
}

function buildMissingOrderMessage(missing: Array<keyof ServiceOrderDraft>) {
  return `Para crear la orden necesito estos datos obligatorios: ${missing.map((field) => ORDER_FIELD_LABELS[field]).join(", ")}.\n\nPuedes responder en este formato:\nCliente: \nTeléfono: \nMarca: \nModelo: \nColor: \nDaño reportado: \nCondición física:`;
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ChatLayout() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeId, setActiveId] = useState(mockConversations[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionSet | null>(null);
  const [stages, setStages] = useState<Record<string, DemoStage>>({ [mockConversations[0].id]: "device" });
  const [orderDrafts, setOrderDrafts] = useState<Record<string, ServiceOrderDraft>>({});
  const timerRef = useRef<number | null>(null);
  const sequenceRef = useRef(0);

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? conversations[0],
    [activeId, conversations],
  );

  const nextId = (prefix: string) => `${prefix}-${Date.now()}-${++sequenceRef.current}`;

  const appendMessages = (conversationId: string, messages: ChatMessage[], preview?: string) => {
    setConversations((current) => current.map((conversation) => conversation.id === conversationId ? {
      ...conversation,
      messages: [...conversation.messages, ...messages],
      preview: preview ?? conversation.preview,
      updatedAt: "Ahora",
    } : conversation));
  };

  const answerAfterDelay = (conversationId: string, messages: ChatMessage[], nextSuggestions: SuggestionSet | null, nextStage: DemoStage) => {
    setIsTyping(true);
    timerRef.current = window.setTimeout(() => {
      const lastMessage = messages.at(-1);
      appendMessages(conversationId, messages, lastMessage?.type === "text" ? lastMessage.content : undefined);
      setSuggestions(nextSuggestions);
      setStages((current) => ({ ...current, [conversationId]: nextStage }));
      setIsTyping(false);
    }, 850);
  };

  const handleInventoryQuery = async (conversationId: string, content: string) => {
    setIsTyping(true);
    try {
      const results = await searchInventoryForCopilot(content);
      const now = currentTime();
      const shouldAskBrand = results.some((item) => item.requiereMarca);
      const intro = shouldAskBrand
        ? "Encontré estos tipos disponibles en el inventario local. ¿Qué marca necesitas?"
        : `Encontré ${results.length} resultado${results.length === 1 ? "" : "s"} en el inventario local.`;
      const messages: ChatMessage[] = results.length > 0
        ? [
          { id: nextId("assistant"), role: "assistant", type: "text", content: intro, createdAt: now },
          ...results.map((item, index): ChatMessage => ({
            id: nextId("inventory"),
            role: "assistant",
            type: "inventory",
            data: {
              id: `inventory-${index}-${item.nombre}`,
              name: item.nombre,
              sku: item.tipoResultado === "type" ? item.categoria : [item.categoria, item.color].filter(Boolean).join(" · "),
              compatibility: item.tipoResultado === "type"
                ? `Marcas: ${(item.marcasDisponibles ?? []).join(", ") || "por confirmar"}`
                : [item.marca, item.modelo, item.color].filter(Boolean).join(" · ") || item.categoria,
              stock: item.stock,
              price: item.precioVenta ?? 0,
              location: "Inventario local",
            },
            createdAt: now,
          })),
        ]
        : [{ id: nextId("assistant"), role: "assistant", type: "text", content: "No encontré resultados en el inventario local para esa consulta.", createdAt: now }];

      appendMessages(conversationId, messages, results.length > 0 ? "Resultados de inventario local." : "Sin resultados de inventario.");
    } catch {
      appendMessages(conversationId, [{ id: nextId("alert"), role: "assistant", type: "alert", data: { tone: "warning", title: "No pude consultar el inventario", description: "La consulta local no se completó. Intenta de nuevo o revisa el inventario." }, createdAt: currentTime() }], "No pude consultar el inventario.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleOrderQuery = async (conversationId: string, content: string) => {
    setIsTyping(true);
    try {
      const results = await searchOrdersForCopilot(content);
      const now = currentTime();
      const contentText = results.length > 0
        ? [
          `Encontré ${results.length} orden${results.length === 1 ? "" : "es"} de servicio local${results.length === 1 ? "" : "es"}.`,
          "",
          ...results.map((order) => [
            `Orden: ${order.numeroOrden}`,
            `Cliente: ${order.cliente}`,
            `Equipo: ${order.equipo}`,
            `Estado: ${order.estado}`,
            `Fecha: ${formatOrderDate(order.fecha)}`,
          ].join("\n")),
        ].join("\n\n")
        : "No encontré órdenes de servicio locales para esa consulta.";

      appendMessages(conversationId, [{ id: nextId("assistant"), role: "assistant", type: "text", content: contentText, createdAt: now }], results.length > 0 ? "Resultados de órdenes locales." : "Sin resultados de órdenes.");
    } catch {
      appendMessages(conversationId, [{ id: nextId("alert"), role: "assistant", type: "alert", data: { tone: "warning", title: "No pude consultar las órdenes", description: "La consulta local no se completó. Intenta de nuevo o revisa las órdenes de servicio." }, createdAt: currentTime() }], "No pude consultar las órdenes.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleCreateOrderFlow = async (conversationId: string, content: string) => {
    const mergedDraft = mergeOrderDraft(orderDrafts[conversationId], parseOrderDraft(content));
    const missing = missingOrderFields(mergedDraft);

    if (missing.length > 0) {
      setOrderDrafts((current) => ({ ...current, [conversationId]: mergedDraft }));
      appendMessages(conversationId, [{ id: nextId("assistant"), role: "assistant", type: "text", content: buildMissingOrderMessage(missing), createdAt: currentTime() }], "Faltan datos para crear la orden.");
      return;
    }

    setIsTyping(true);
    try {
      const order = await createOrderForCopilot({
        clientName: mergedDraft.clientName,
        clientPhone: mergedDraft.clientPhone,
        brand: mergedDraft.brand,
        model: mergedDraft.model,
        color: mergedDraft.color,
        reportedDamage: mergedDraft.reportedDamage,
        physicalCondition: mergedDraft.physicalCondition,
        accessories: [],
        observations: "",
        status: "Recibido",
      });
      setOrderDrafts((current) => {
        const next = { ...current };
        delete next[conversationId];
        return next;
      });
      appendMessages(conversationId, [{ id: nextId("assistant"), role: "assistant", type: "text", content: [
        "Orden de servicio creada correctamente.",
        "",
        `Número de orden: ${order.numeroOrden}`,
        `Cliente: ${order.cliente}`,
        `Equipo: ${order.equipo}`,
        `Estado inicial: ${order.estadoInicial}`,
        `Fecha: ${formatOrderDate(order.fecha)}`,
      ].join("\n"), createdAt: currentTime() }], `Orden creada: ${order.numeroOrden}`);
    } catch {
      appendMessages(conversationId, [{ id: nextId("alert"), role: "assistant", type: "alert", data: { tone: "warning", title: "No pude crear la orden", description: "La orden local no se completó. Revisa los datos obligatorios e intenta de nuevo." }, createdAt: currentTime() }], "No pude crear la orden.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (content: string) => {
    if (!activeConversation || isTyping) return;
    const conversationId = activeConversation.id;
    const userMessage: ChatMessage = { id: nextId("user"), role: "user", type: "text", content, createdAt: currentTime() };
    appendMessages(conversationId, [userMessage], content);
    setSuggestions(null);

    if (orderDrafts[conversationId] || isCreateOrderIntent(content)) {
      await handleCreateOrderFlow(conversationId, content);
      return;
    }

    if (isOrderQuery(content)) {
      await handleOrderQuery(conversationId, content);
      return;
    }

    if (isInventoryQuery(content)) {
      await handleInventoryQuery(conversationId, content);
      return;
    }

    const stage = stages[conversationId] ?? "ready";
    if (stage === "device") {
      answerAfterDelay(conversationId, [{ id: nextId("assistant"), role: "assistant", type: "text", content: "Perfecto. ¿Qué problema presenta el equipo?", createdAt: currentTime() }], { id: "issue", options: ["Pantalla", "Batería", "Carga", "Humedad"] }, "issue");
      return;
    }

    answerAfterDelay(conversationId, [{ id: nextId("assistant"), role: "assistant", type: "text", content: "Entendido. En esta demo puedo organizar el contexto y preparar la siguiente acción sin enviar información fuera del equipo.", createdAt: currentTime() }], null, stage);
  };

  const handleSuggestion = (value: string) => {
    if (!suggestions || !activeConversation || isTyping) return;
    const conversationId = activeConversation.id;
    appendMessages(conversationId, [{ id: nextId("choice"), role: "user", type: "text", content: value, createdAt: currentTime() }], value);
    const suggestionId = suggestions.id;
    setSuggestions(null);

    if (suggestionId === "issue") {
      const inventory = value === "Batería" ? mockInventory : { ...mockInventory, id: `mock-${value.toLowerCase()}`, name: `Repuesto compatible · ${value}`, sku: `MOCK-${value.toUpperCase()}` };
      answerAfterDelay(conversationId, [
        { id: nextId("assistant"), role: "assistant", type: "text", content: `Encontré una opción disponible para ${value.toLowerCase()}.`, createdAt: currentTime() },
        { id: nextId("inventory"), role: "assistant", type: "inventory", data: inventory, createdAt: currentTime() },
        { id: nextId("assistant"), role: "assistant", type: "text", content: "¿El cliente ya existe en el sistema?", createdAt: currentTime() },
      ], { id: "customer", options: ["Sí, buscar cliente", "No, crear cliente"] }, "customer");
      return;
    }

    const customer = value.startsWith("Sí") ? mockCustomer : { ...mockCustomer, id: "new-customer", name: "Cliente nuevo", phone: "Datos pendientes", visits: 0, lastVisit: "Primera visita", label: "Nuevo" };
    answerAfterDelay(conversationId, [
      { id: nextId("customer"), role: "assistant", type: "customer", data: customer, createdAt: currentTime() },
      { id: nextId("assistant"), role: "assistant", type: "text", content: "Listo. Preparé un borrador con la información disponible.", createdAt: currentTime() },
      { id: nextId("order"), role: "assistant", type: "order", data: mockOrder, createdAt: currentTime() },
      { id: nextId("warranty"), role: "assistant", type: "warranty", data: mockWarranty, createdAt: currentTime() },
      { id: nextId("knowledge"), role: "assistant", type: "knowledge", data: mockKnowledge, createdAt: currentTime() },
      { id: nextId("action"), role: "assistant", type: "action", data: { title: "Todo listo para continuar", description: "Esta fase solo simula las acciones. Ningún registro será guardado.", actions: [{ id: "create-order", label: "Crear orden", variant: "primary" }, { id: "review", label: "Revisar datos", variant: "secondary" }] }, createdAt: currentTime() },
    ], null, "ready");
  };

  const handleAction = (actionId: string) => {
    if (!activeConversation) return;
    const isCreate = actionId === "create-order";
    appendMessages(activeConversation.id, [{ id: nextId("alert"), role: "assistant", type: "alert", data: { tone: isCreate ? "success" : "info", title: isCreate ? "Orden preparada en modo demo" : "Datos revisados", description: isCreate ? "La integración real se habilitará en una fase posterior. No se guardó información." : "El borrador conserva todos los datos mock para que puedas seguir conversando." }, createdAt: currentTime() }]);
  };

  const handleNewChat = () => {
    const id = nextId("conversation");
    const conversation: Conversation = { id, title: "Nueva conversación", preview: "Sin mensajes todavía", updatedAt: "Ahora", status: "active", messages: welcomeMessages.map((message) => ({ ...message, id: nextId("welcome") })) };
    setConversations((current) => [conversation, ...current]);
    setStages((current) => ({ ...current, [id]: "device" }));
    setActiveId(id);
    setSuggestions(null);
    setIsSidebarOpen(false);
  };

  const renameConversation = (id: string, title: string) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    setConversations((current) => current.map((conversation) => conversation.id === id ? { ...conversation, title: cleanTitle } : conversation));
  };

  const deleteConversation = (id: string) => {
    if (conversations.length <= 1) return;
    const next = conversations.filter((conversation) => conversation.id !== id);
    if (activeId === id && next[0]) {
      setActiveId(next[0].id);
      setSuggestions(null);
    }
    setConversations(next);
  };

  const archiveConversation = (id: string) => {
    setConversations((current) => current.map((conversation) => conversation.id === id ? { ...conversation, status: "archived" } : conversation));
  };

  const selectConversation = (id: string) => {
    setActiveId(id);
    setSuggestions(null);
    setIsTyping(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
  };

  if (!activeConversation) return null;

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-[radial-gradient(circle_at_top_left,#f4f1ff_0,#fafaf9_34%,#f4f4f5_100%)]">
      <ConversationSidebar conversations={conversations} activeId={activeId} open={isSidebarOpen} visible={isHistoryVisible} onClose={() => setIsSidebarOpen(false)} onHide={() => setIsHistoryVisible(false)} onSelect={selectConversation} onNewChat={handleNewChat} onRename={renameConversation} onDelete={deleteConversation} onArchive={archiveConversation} />
      <section className="flex min-w-0 flex-1 flex-col">
        <ConversationHeader title={activeConversation.title} historyVisible={isHistoryVisible} onOpenSidebar={() => { setIsHistoryVisible(true); setIsSidebarOpen(true); }} onToggleHistory={() => setIsHistoryVisible((visible) => !visible)} />
        <MessageList messages={activeConversation.messages} isTyping={isTyping} onAction={handleAction} onQuickPrompt={handleSend} />
        {suggestions && <div className="border-t border-zinc-200/60 bg-white/70 px-4 py-3 backdrop-blur-xl"><div className="mx-auto max-w-3xl pl-0 sm:pl-12"><SuggestionChips options={suggestions.options} disabled={isTyping} onSelect={handleSuggestion} /></div></div>}
        <ChatInput disabled={isTyping} onSend={handleSend} />
      </section>
    </div>
  );
}
