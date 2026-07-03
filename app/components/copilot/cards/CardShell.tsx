import type { ReactNode } from "react";

export default function CardShell({ icon, eyebrow, children, accent = "zinc" }: { icon: ReactNode; eyebrow: string; children: ReactNode; accent?: "zinc" | "emerald" | "blue" | "amber" | "violet" }) {
  const accents = {
    zinc: "bg-zinc-950 text-white shadow-zinc-950/20",
    emerald: "bg-emerald-500 text-white shadow-emerald-500/20",
    blue: "bg-blue-500 text-white shadow-blue-500/20",
    amber: "bg-amber-500 text-white shadow-amber-500/20",
    violet: "bg-violet-500 text-white shadow-violet-500/20",
  }[accent];

  return (
    <article className="w-full overflow-hidden rounded-[1.6rem] border border-white/80 bg-white/90 shadow-[0_18px_60px_rgba(24,24,27,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(24,24,27,0.11)]">
      <div className="flex items-center gap-3 border-b border-zinc-100/80 bg-gradient-to-r from-white to-zinc-50/70 px-4 py-3.5 sm:px-5">
        <span className={`flex h-9 w-9 items-center justify-center rounded-2xl shadow-lg ${accents}`}>{icon}</span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{eyebrow}</p>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </article>
  );
}
