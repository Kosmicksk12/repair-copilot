import { ShieldIcon } from "../Icons";
import type { WarrantyMessageData } from "../types";
import CardShell from "./CardShell";

export default function WarrantyCard({ warranty }: { warranty: WarrantyMessageData }) {
  return (
    <CardShell icon={<ShieldIcon className="h-4 w-4" />} eyebrow="Garantía" accent="amber">
      <div className="flex items-start justify-between gap-4"><h3 className="text-base font-semibold text-zinc-950">{warranty.title}</h3><span className="shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">{warranty.duration}</span></div>
      <p className="mt-3 text-sm leading-6 text-zinc-600">{warranty.coverage}</p>
      <p className="mt-4 rounded-2xl bg-amber-50/70 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-100">No cubre: {warranty.exclusions.join(" · ")}</p>
    </CardShell>
  );
}
