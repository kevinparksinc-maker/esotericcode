import type { TechnicalAction } from "@shared/esoteric";
import { ArrowUpRight } from "lucide-react";

export function ActionCards({ actions }: { actions: TechnicalAction[] }) {
  return <section className="mt-14"><div className="section-heading"><div><p className="eyebrow">Grounded direction</p><h2 className="section-title">Technical next steps</h2></div><ArrowUpRight className="h-5 w-5 text-amber-200" /></div><div className="mt-6 grid gap-4 md:grid-cols-3">{actions.map((action, index) => <article key={action.step} className="action-card"><span className="text-xs font-semibold text-amber-200">0{index + 1} · {action.step}</span><h3 className="mt-4 font-serif text-2xl text-amber-50">{action.title}</h3><p className="mt-3 text-sm leading-6 text-slate-300">{action.detail}</p></article>)}</div></section>;
}
