"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import MessageRenderer from "./MessageRenderer";
import TypingIndicator from "./TypingIndicator";
import type { ChatMessage, MessageActionHandler } from "./types";

const quickPrompts = [
  "Tengo un iPhone 13.",
  "Necesito revisar una garantía.",
  "Quiero preparar una orden.",
];

export default function MessageList({ messages, isTyping, onAction, onQuickPrompt }: { messages: ChatMessage[]; isTyping: boolean; onAction: MessageActionHandler; onQuickPrompt?: (prompt: string) => void }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [isTyping, messages]);
  const showWelcome = messages.length === 1 && messages[0].role === "assistant" && messages[0].type === "text";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6 sm:py-8">
        {showWelcome && (
          <section className="mb-2 overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-[0_24px_80px_rgba(24,24,27,0.08)] backdrop-blur-xl sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">RepairCopilot AI · Demo local</p>
                <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-3xl">¿Qué reparación quieres organizar hoy?</h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-500">Describe el equipo, el síntoma o el cliente. En esta fase todo corre con datos mock y sin conexiones externas.</p>
              </div>
              <div className="rounded-2xl border border-zinc-200/70 bg-zinc-950 px-4 py-3 text-white shadow-lg shadow-zinc-950/10">
                <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">Estado</p>
                <p className="mt-1 text-sm font-medium">Listo para analizar</p>
              </div>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {quickPrompts.map((prompt) => (
                <button key={prompt} type="button" disabled={isTyping} onClick={() => onQuickPrompt?.(prompt)} className="rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 text-left text-sm font-medium text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50">
                  {prompt}
                </button>
              ))}
            </div>
          </section>
        )}
        {messages.map((message) => <MessageBubble key={message.id} role={message.role} type={message.type} timestamp={message.createdAt}><MessageRenderer message={message} onAction={onAction} /></MessageBubble>)}
        {isTyping && <TypingIndicator />}
        <div ref={endRef} />
      </div>
    </div>
  );
}
