"use client";

import { useMemo, useState } from "react";
import { ChatIcon, CloseIcon, MoreIcon, PlusIcon, SparkIcon } from "./Icons";
import type { Conversation } from "./types";

const sections = [
  { title: "Hoy", match: (updatedAt: string) => updatedAt === "Ahora" },
  { title: "Ayer", match: (updatedAt: string) => updatedAt === "Ayer" },
  { title: "Esta semana", match: (updatedAt: string) => updatedAt.includes("jun") },
  { title: "Anteriores", match: () => true },
];

type ConversationSidebarProps = {
  conversations: Conversation[];
  activeId: string;
  open: boolean;
  visible: boolean;
  onClose: () => void;
  onHide: () => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
};

export default function ConversationSidebar({ conversations, activeId, open, visible, onClose, onHide, onSelect, onNewChat, onRename, onDelete, onArchive }: ConversationSidebarProps) {
  const [query, setQuery] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const filteredConversations = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return conversations;
    return conversations.filter((conversation) => `${conversation.title} ${conversation.preview}`.toLowerCase().includes(cleanQuery));
  }, [conversations, query]);

  const groupedConversations = sections.map((section, index) => ({
    ...section,
    conversations: filteredConversations.filter((conversation) => section.match(conversation.updatedAt) && sections.slice(0, index).every((previous) => !previous.match(conversation.updatedAt))),
  }));

  const startRename = (conversation: Conversation) => {
    setRenamingId(conversation.id);
    setDraftTitle(conversation.title);
    setMenuId(null);
  };

  const saveRename = (id: string) => {
    onRename(id, draftTitle);
    setRenamingId(null);
    setDraftTitle("");
  };

  const showPanel = open || visible;

  return (
    <>
      {open && <button type="button" aria-label="Cerrar conversaciones" onClick={onClose} className="fixed inset-0 z-30 bg-zinc-950/30 backdrop-blur-sm md:hidden" />}
      <aside className={`absolute inset-y-0 left-0 z-40 flex w-[264px] shrink-0 flex-col overflow-hidden border-r border-white/70 bg-zinc-950 text-white shadow-2xl shadow-zinc-950/20 transition-all duration-300 ease-out md:static md:shadow-none ${showPanel ? "translate-x-0 opacity-100 md:w-[264px]" : "-translate-x-full opacity-0 pointer-events-none md:w-0"}`}>
        <div className="flex h-16 items-center justify-between px-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm"><SparkIcon className="h-4 w-4" /></span>
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">RepairCopilot</p><p className="truncate text-[11px] text-zinc-400">Historial local</p></div>
          </div>
          <button type="button" aria-label="Ocultar historial" onClick={() => { onClose(); onHide(); }} className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white"><CloseIcon className="h-4 w-4" /></button>
        </div>

        <div className="space-y-2 px-3 pb-3">
          <button type="button" onClick={onNewChat} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-100"><PlusIcon className="h-4 w-4" />Nuevo chat</button>
          <label className="block">
            <span className="sr-only">Buscar conversaciones</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar chats..." className="h-10 w-full rounded-2xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/30 focus:bg-white/[0.14]" />
          </label>
        </div>

        <nav aria-label="Conversaciones" className="flex-1 space-y-4 overflow-y-auto px-2 pb-4 pt-2">
          {groupedConversations.filter((section) => section.conversations.length > 0).map((section) => (
            <div key={section.title}>
              <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{section.title}</p>
              <div className="space-y-1">
                {section.conversations.map((conversation) => {
                  const active = conversation.id === activeId;
                  const archived = conversation.status === "archived";
                  const renaming = renamingId === conversation.id;

                  return (
                    <div key={conversation.id} className={`group relative rounded-2xl transition ${active ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-300 hover:bg-white/10 hover:text-white"} ${archived ? "opacity-60" : ""}`}>
                      <div className="flex items-start gap-2 px-2.5 py-2.5">
                        <ChatIcon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-violet-500" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                        {renaming ? (
                          <div className="min-w-0 flex-1">
                            <input autoFocus value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveRename(conversation.id); if (event.key === "Escape") setRenamingId(null); }} onBlur={() => saveRename(conversation.id)} className="h-8 w-full rounded-xl border border-zinc-200 bg-white px-2 text-xs font-semibold text-zinc-950 outline-none focus:border-violet-300" />
                          </div>
                        ) : (
                          <button type="button" onClick={() => { onSelect(conversation.id); onClose(); }} className="min-w-0 flex-1 text-left">
                            <span className={`block truncate text-[13px] ${active ? "font-semibold" : "font-medium"}`}>{conversation.title}</span>
                            <span className={`mt-1 block truncate text-[11px] ${active ? "text-zinc-500" : "text-zinc-500 group-hover:text-zinc-400"}`}>{conversation.preview}</span>
                            {archived && <span className="mt-1.5 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 ring-1 ring-white/10">Archivado</span>}
                          </button>
                        )}
                        <div className="flex shrink-0 items-start gap-1">
                          <span className={`pt-1 text-[10px] ${active ? "text-zinc-400" : "text-zinc-600"}`}>{conversation.updatedAt}</span>
                          <button type="button" aria-label={`Opciones de ${conversation.title}`} onClick={() => setMenuId((current) => current === conversation.id ? null : conversation.id)} className={`rounded-lg p-1 transition ${active ? "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" : "text-zinc-600 hover:bg-white/10 hover:text-white"}`}><MoreIcon className="h-4 w-4" /></button>
                        </div>
                      </div>

                      {menuId === conversation.id && (
                        <div className="absolute right-2 top-9 z-50 w-36 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 text-sm text-zinc-700 shadow-xl shadow-zinc-950/15">
                          <button type="button" onClick={() => startRename(conversation)} className="block w-full px-3 py-2 text-left hover:bg-zinc-50">Renombrar</button>
                          <button type="button" onClick={() => { onArchive(conversation.id); setMenuId(null); }} className="block w-full px-3 py-2 text-left hover:bg-zinc-50">Archivar</button>
                          <button type="button" onClick={() => { onDelete(conversation.id); setMenuId(null); }} className="block w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50">Eliminar</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {filteredConversations.length === 0 && <p className="px-3 py-6 text-center text-xs leading-5 text-zinc-500">No hay conversaciones que coincidan con tu búsqueda.</p>}
        </nav>

        <div className="border-t border-white/10 p-3"><div className="rounded-2xl bg-white/10 px-3 py-3 ring-1 ring-white/10"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]" /><p className="text-xs font-medium text-zinc-200">Modo demostración</p></div><p className="mt-1.5 text-[11px] leading-4 text-zinc-500">Datos locales · Sin conexiones externas</p></div></div>
      </aside>
    </>
  );
}
