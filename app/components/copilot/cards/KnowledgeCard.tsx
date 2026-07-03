import { BookIcon } from "../Icons";
import type { KnowledgeMessageData } from "../types";
import CardShell from "./CardShell";

export default function KnowledgeCard({ article }: { article: KnowledgeMessageData }) {
  return (
    <CardShell icon={<BookIcon className="h-4 w-4" />} eyebrow={article.eyebrow} accent="blue">
      <div className="flex items-start justify-between gap-4"><h3 className="text-base font-semibold text-zinc-950">{article.title}</h3><span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100">Confianza {article.confidence.toLowerCase()}</span></div>
      <p className="mt-3 text-sm leading-6 text-zinc-600">{article.summary}</p>
      <p className="mt-4 inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">{article.source}</p>
    </CardShell>
  );
}
