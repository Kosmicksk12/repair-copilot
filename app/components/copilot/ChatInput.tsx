"use client";

import { useState } from "react";
import { SendIcon } from "./Icons";

export default function ChatInput({ disabled, onSend }: { disabled?: boolean; onSend: (message: string) => void }) {
  const [value, setValue] = useState("");
  const submit = () => { const clean = value.trim(); if (!clean || disabled) return; onSend(clean); setValue(""); };
  return (
    <div className="border-t border-white/70 bg-white/75 px-3 py-3 shadow-[0_-20px_60px_rgba(24,24,27,0.06)] backdrop-blur-xl sm:px-6 sm:py-4">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-[1.6rem] border border-zinc-200/80 bg-white p-2 shadow-[0_18px_60px_rgba(24,24,27,0.10)] transition focus-within:border-zinc-400 focus-within:shadow-[0_18px_70px_rgba(24,24,27,0.14)]">
          <textarea rows={1} value={value} disabled={disabled} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }} placeholder="Pregunta por una reparación, cliente, repuesto u orden..." className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 text-zinc-800 outline-none placeholder:text-zinc-400 disabled:opacity-60" />
          <button type="button" onClick={submit} disabled={disabled || !value.trim()} aria-label="Enviar mensaje" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 disabled:hover:translate-y-0"><SendIcon className="h-4 w-4" /></button>
        </div>
        <p className="mt-2 text-center text-[10px] text-zinc-400">Demo local con datos mock. Sin IA, Supabase ni llamadas externas.</p>
      </div>
    </div>
  );
}
