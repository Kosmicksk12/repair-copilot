export function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    Recibido: "bg-zinc-100 text-zinc-700 ring-zinc-200",
    Diagnóstico: "bg-amber-50 text-amber-700 ring-amber-200",
    "En reparación": "bg-blue-50 text-blue-700 ring-blue-200",
    Listo: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Entregado: "bg-slate-100 text-slate-600 ring-slate-200",
    Pagada: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  };
  return map[status] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200";
}
