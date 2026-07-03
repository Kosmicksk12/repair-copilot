import { UserIcon } from "../Icons";
import type { CustomerMessageData } from "../types";
import CardShell from "./CardShell";

export default function CustomerCard({ customer }: { customer: CustomerMessageData }) {
  return (
    <CardShell icon={<UserIcon className="h-4 w-4" />} eyebrow="Cliente encontrado" accent="blue">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-950">{customer.name}</h3>
          <p className="mt-1 text-sm text-zinc-500">{customer.phone}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100">{customer.label}</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-100"><p className="text-zinc-400">Visitas</p><p className="mt-1 font-semibold text-zinc-800">{customer.visits}</p></div>
        <div className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-zinc-100"><p className="text-zinc-400">Última visita</p><p className="mt-1 font-semibold text-zinc-800">{customer.lastVisit}</p></div>
      </div>
    </CardShell>
  );
}
