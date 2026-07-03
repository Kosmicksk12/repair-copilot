import { formatCurrency } from "@/lib/format-currency";
import { ClipboardIcon } from "../Icons";
import type { OrderMessageData } from "../types";
import CardShell from "./CardShell";

export default function OrderCard({ order }: { order: OrderMessageData }) {
  return (
    <CardShell icon={<ClipboardIcon className="h-4 w-4" />} eyebrow="Borrador de orden" accent="violet">
      <div className="flex items-start justify-between gap-4">
        <div><h3 className="text-base font-semibold text-zinc-950">{order.device}</h3><p className="mt-1 text-sm text-zinc-500">{order.service}</p></div>
        <span className="rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-100">{order.status}</span>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-100"><dt className="text-zinc-400">Valor estimado</dt><dd className="mt-1 font-semibold text-zinc-900">{formatCurrency(order.estimatedValue)}</dd></div>
        <div className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-100"><dt className="text-zinc-400">Tiempo estimado</dt><dd className="mt-1 font-semibold text-zinc-900">{order.estimatedTime}</dd></div>
      </dl>
    </CardShell>
  );
}
