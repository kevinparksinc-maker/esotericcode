import type { TarotCard } from "@shared/esoteric";
import { ArrowUpRight } from "lucide-react";

const glyphs: Record<TarotCard["suit"], string> = { major: "✦", wands: "♢", cups: "◒", swords: "†", pentacles: "⊕" };

export function TarotCardView({ card, index }: { card: TarotCard; index: number }) {
  const orientation = card.orientation ?? "upright";
  return (
    <article className={`tarot-card ${orientation === "reversed" ? "is-reversed" : ""}`} style={{ animationDelay: `${index * 90}ms` }}>
      <div className="tarot-card__rim" />
      <div className="relative z-10 flex h-full flex-col p-5">
        <div className="flex items-start justify-between"><span className="tarot-number">{card.cardNumber}</span><span className="tarot-orientation">{orientation === "reversed" ? "↧ REVERSED" : "↥ UPRIGHT"}</span><span className="tarot-glyph">{glyphs[card.suit]}</span></div>
        <div className="my-auto text-center"><p className="tarot-position">{card.position}</p><h3 className="font-display text-2xl leading-tight text-amber-50">{card.cardName}</h3></div>
        <div className="border-t border-amber-100/15 pt-3"><p className="line-clamp-2 text-[11px] leading-relaxed text-violet-100/70">{card.metricTrigger}</p></div>
      </div>
    </article>
  );
}

export function TarotCardDetail({ card }: { card: TarotCard }) {
  const orientation = card.orientation ?? "upright";
  return <div className={`detail-card ${orientation === "reversed" ? "is-reversed" : ""}`}><div className="mb-4 flex items-center justify-between"><span className="eyebrow">{card.position} · {orientation}</span><ArrowUpRight className="h-4 w-4 text-amber-200" /></div><h3 className="font-display text-2xl text-amber-50">{card.cardName}</h3><p className="mt-4 text-sm leading-6 text-slate-300">{card.mysticalInterpretation}</p><div className="mt-5 border-l border-amber-300/60 pl-3 text-sm leading-6 text-amber-100/90">{card.technicalActionable}</div>{card.orientationEvidence && <p className="orientation-evidence">{card.orientationEvidence}</p>}</div>;
}
