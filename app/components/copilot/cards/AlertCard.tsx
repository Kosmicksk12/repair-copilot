import { CheckIcon } from "../Icons";
import type { AlertMessageData } from "../types";

export default function AlertCard({ alert }: { alert: AlertMessageData }) {
  const styles = {
    success: "border-emerald-200/80 bg-emerald-50/90 text-emerald-950 shadow-emerald-950/5",
    warning: "border-amber-200/80 bg-amber-50/90 text-amber-950 shadow-amber-950/5",
    info: "border-blue-200/80 bg-blue-50/90 text-blue-950 shadow-blue-950/5",
  }[alert.tone];
  return (
    <article className={`flex gap-3 rounded-[1.35rem] border p-4 shadow-lg backdrop-blur ${styles}`}>
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-sm"><CheckIcon className="h-3.5 w-3.5" /></span>
      <div><h3 className="text-sm font-semibold">{alert.title}</h3><p className="mt-1 text-xs leading-5 opacity-75">{alert.description}</p></div>
    </article>
  );
}
