export default function SuggestionChips({ options, disabled, onSelect }: { options: string[]; disabled?: boolean; onSelect: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Respuestas sugeridas">
      {options.map((option) => <button key={option} type="button" disabled={disabled} onClick={() => onSelect(option)} className="rounded-full border border-zinc-200/80 bg-white/90 px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm">{option}</button>)}
    </div>
  );
}
