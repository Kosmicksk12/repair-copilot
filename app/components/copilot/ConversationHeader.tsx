import { MenuIcon, MoreIcon, SparkIcon } from "./Icons";

export default function ConversationHeader({ title, historyVisible, onOpenSidebar, onToggleHistory }: { title: string; historyVisible: boolean; onOpenSidebar: () => void; onToggleHistory: () => void }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/70 bg-white/75 px-4 shadow-sm shadow-zinc-950/[0.03] backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" aria-label="Abrir conversaciones" onClick={onOpenSidebar} className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-600 shadow-sm hover:bg-zinc-50 md:hidden"><MenuIcon className="h-4 w-4" /></button>
        <button type="button" aria-label={historyVisible ? "Ocultar historial" : "Mostrar historial"} onClick={onToggleHistory} className="hidden rounded-xl border border-zinc-200 bg-white p-2 text-zinc-600 shadow-sm transition hover:bg-zinc-50 md:inline-flex"><MenuIcon className="h-4 w-4" /></button>
        <span className="hidden h-9 w-9 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm sm:flex"><SparkIcon className="h-4 w-4" /></span>
        <div className="min-w-0"><h1 className="truncate text-sm font-semibold text-zinc-950 sm:text-base">{title}</h1><div className="mt-0.5 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" /><p className="text-[11px] text-zinc-400">RepairCopilot · Demo local</p></div></div>
      </div>
      <button type="button" aria-label="Más opciones" className="rounded-xl p-2 text-zinc-400 transition hover:bg-white hover:text-zinc-700 hover:shadow-sm"><MoreIcon className="h-5 w-5" /></button>
    </header>
  );
}
