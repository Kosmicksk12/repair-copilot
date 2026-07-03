import { SparkIcon } from "./Icons";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm"><SparkIcon className="h-4 w-4" /></span>
      <div className="flex items-center gap-3 rounded-[1.35rem] rounded-bl-md border border-white/80 bg-white/85 px-4 py-3 shadow-[0_12px_40px_rgba(24,24,27,0.07)] backdrop-blur"><span className="text-sm text-zinc-500">RepairCopilot está analizando</span><span className="flex gap-1"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.2s]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.1s]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" /></span></div>
    </div>
  );
}
