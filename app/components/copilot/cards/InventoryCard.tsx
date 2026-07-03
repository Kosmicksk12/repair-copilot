import { formatCurrency } from "@/lib/format-currency";
import { PackageIcon } from "../Icons";
import type { InventoryMessageData } from "../types";
import CardShell from "./CardShell";

export default function InventoryCard({ item }: { item: InventoryMessageData }) {
  return (
    <CardShell icon={<PackageIcon className="h-4 w-4" />} eyebrow="Inventario" accent="emerald">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-zinc-950">{item.name}</h3>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{item.compatibility}</p>
          <p className="mt-3 inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">SKU {item.sku} · {item.location}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">{item.stock} disponibles</span>
          <p className="text-base font-semibold text-zinc-950">{formatCurrency(item.price)}</p>
        </div>
      </div>
    </CardShell>
  );
}
