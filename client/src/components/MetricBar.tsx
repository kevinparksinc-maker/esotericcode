export function MetricBar({ label, value, detail, tone = "violet" }: { label: string; value: number; detail: string; tone?: "violet" | "amber" | "rose" }) {
  return (
    <div className="metric-bar">
      <div className="flex items-baseline justify-between gap-3"><span className="metric-label">{label}</span><span className="font-mono text-xs text-slate-300">{detail}</span></div>
      <div className="metric-track"><div className={`metric-fill ${tone}`} style={{ width: `${Math.max(4, Math.min(value, 100))}%` }} /></div>
    </div>
  );
}
