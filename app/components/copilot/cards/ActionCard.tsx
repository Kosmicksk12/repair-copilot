import { BoltIcon } from "../Icons";
import type { ActionMessageData, MessageActionHandler } from "../types";
import CardShell from "./CardShell";

export default function ActionCard({ data, onAction }: { data: ActionMessageData; onAction?: MessageActionHandler }) {
  return (
    <CardShell icon={<BoltIcon className="h-4 w-4" />} eyebrow="Siguiente paso">
      <h3 className="text-base font-semibold text-zinc-950">{data.title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{data.description}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {data.actions.map((action) => (
          <button key={action.id} type="button" onClick={() => onAction?.(action.id)} className={action.variant === "primary" ? "rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800" : "rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-50"}>{action.label}</button>
        ))}
      </div>
    </CardShell>
  );
}
