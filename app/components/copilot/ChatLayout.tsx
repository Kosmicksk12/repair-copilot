"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { searchInventoryForCopilot } from "./actions";
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

export default function ChatLayout() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeId, setActiveId] = useState(mockConversations[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionSet | null>(null);
  const [stages, setStages] = useState<Record<string, DemoStage>>({ [mockConversations[0].id]: "device" });
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
      const messages: ChatMessage[] = results.length > 0
        ? [
          { id: nextId("assistant"), role: "assistant", type: "text", content: `Encontré ${results.length} resultado${results.length === 1 ? "" : "s"} en el inventario local.`, createdAt: now },
          ...results.map((item, index): ChatMessage => ({
            id: nextId("inventory"),
            role: "assistant",
            type: "inventory",
            data: {
              id: `inventory-${index}-${item.nombre}`,
              name: item.nombre,
              sku: item.categoria,
              compatibility: [item.marca, item.modelo].filter(Boolean).join(" · ") || item.categoria,
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

  const handleSend = async (content: string) => {
    if (!activeConversation || isTyping) return;
    const conversationId = activeConversation.id;
    const userMessage: ChatMessage = { id: nextId("user"), role: "user", type: "text", content, createdAt: currentTime() };
    appendMessages(conversationId, [userMessage], content);
    setSuggestions(null);

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
