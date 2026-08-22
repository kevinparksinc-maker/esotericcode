import type { RepositoryMetrics } from "@shared/esoteric";
import { buildPlainLanguageActions } from "@shared/plain-language-actions";
import { CheckCircle2, CircleDotDashed, Wrench } from "lucide-react";

const icons = [CircleDotDashed, Wrench, CheckCircle2];

export function PlainLanguageActions({ metrics }: { metrics: RepositoryMetrics }) {
  const actions = buildPlainLanguageActions(metrics);

  return (
    <section className="mt-16">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Plain-English action plan</p>
          <h2 className="font-display text-3xl text-amber-50">What to do next</h2>
        </div>
        <span className="font-mono text-[10px] text-slate-500">PRACTICAL · NO ORACLE-SPEAK</span>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
        This is the simple version of the reading: three useful steps based on the codebase as it is today.
      </p>
      <div className="mt-7 grid gap-4 lg:grid-cols-3">
        {actions.map((item, index) => {
          const Icon = icons[index] ?? CheckCircle2;
          return (
            <article key={item.step} className="panel p-5">
              <div className="flex items-center gap-2 text-amber-200">
                <Icon className="h-4 w-4" />
                <span className="font-mono text-[10px] uppercase tracking-[.12em]">{item.step}</span>
              </div>
              <h3 className="mt-5 font-display text-2xl leading-tight text-amber-50">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{item.explanation}</p>
              <p className="mt-5 border-t border-white/10 pt-4 text-sm leading-6 text-violet-100">
                <span className="font-mono text-[10px] uppercase tracking-[.12em] text-violet-300">Try this: </span>
                {item.action}
              </p>
              <p className="mt-3 rounded-sm border border-amber-200/10 bg-amber-100/[0.035] px-3 py-3 text-xs leading-5 text-amber-100/90">
                <span className="font-mono text-[10px] uppercase tracking-[.12em] text-amber-200">Example: </span>
                {item.example}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
