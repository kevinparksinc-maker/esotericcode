type Tone = "violet" | "amber" | "rose" | "sky";

const tones: Record<Tone, string> = {
  violet: "from-violet-500 to-fuchsia-400",
  amber: "from-amber-400 to-orange-300",
  rose: "from-rose-500 to-pink-400",
  sky: "from-sky-400 to-cyan-300",
};

export function MetricBar({ label, value, detail, tone = "violet" }: { label: string; value: number; detail: string; tone?: Tone }) {
  return <div>
    <div className="mb-2 flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.17em] text-slate-400"><span>{label}</span><span className="text-slate-200">{detail}</span></div>
    <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full bg-gradient-to-r ${tones[tone]}`} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} /></div>
  </div>;
}
