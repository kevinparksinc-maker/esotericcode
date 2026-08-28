import type { TarotCard } from "@shared/esoteric";

export function TarotCardView({ card, index }: { card: TarotCard; index: number }) {
  return <article className="tarot-card group relative overflow-hidden rounded-2xl p-6" style={{ animationDelay: `${index * 90}ms` }}>
    <div className="absolute -right-7 -top-8 text-[9rem] font-serif leading-none text-white/[0.045]">{card.number}</div>
    <div className="relative flex items-start justify-between gap-4"><div><p className="eyebrow">{card.position}</p><h3 className="mt-3 font-serif text-3xl text-amber-50">{card.name}</h3></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${card.orientation === "reversed" ? "border-rose-300/30 bg-rose-400/10 text-rose-200" : "border-violet-300/30 bg-violet-400/10 text-violet-200"}`}>{card.orientation}</span></div>
    <p className="relative mt-5 text-sm leading-6 text-slate-300">{card.technicalReading}</p>
    <div className="relative mt-6 border-t border-white/10 pt-4"><p className="text-xs font-medium leading-5 text-amber-100">{card.action}</p></div>
  </article>;
}
