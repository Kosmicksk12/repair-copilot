import type { ReactNode } from "react";
import { SparkIcon } from "./Icons";

export default function MessageBubble({ role, type, timestamp, children }: { role: "user" | "assistant"; type: string; timestamp: string; children: ReactNode }) {
  const isUser = role === "user";
  const isText = type === "text";
  return (
    <div className={`group flex w-full animate-[fadeIn_220ms_ease-out] gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm shadow-zinc-950/10"><SparkIcon className="h-4 w-4" /></span>}
      <div className={`${isText ? "max-w-[88%] sm:max-w-[74%]" : "w-full max-w-2xl"}`}>
        <div className={`mb-1 flex items-center gap-2 px-1 ${isUser ? "justify-end" : "justify-start"}`}>
          <span className="text-[11px] font-medium text-zinc-400">{isUser ? "Tú" : "RepairCopilot"}</span>
          <span className="text-[10px] text-zinc-300">{timestamp}</span>
        </div>
        <div className={isText ? (isUser ? "rounded-[1.35rem] rounded-br-md bg-zinc-950 px-4 py-3 text-sm leading-6 text-white shadow-lg shadow-zinc-950/10" : "rounded-[1.35rem] rounded-bl-md border border-white/80 bg-white/85 px-4 py-3 text-sm leading-6 text-zinc-700 shadow-[0_12px_40px_rgba(24,24,27,0.07)] backdrop-blur") : ""}>{children}</div>
      </div>
      {isUser && <span className="mt-7 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-xs font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200/80">Tú</span>}
    </div>
  );
}
