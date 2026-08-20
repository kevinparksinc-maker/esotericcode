import { Sparkles } from "lucide-react";

export function OracleMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="oracle-mark"><Sparkles size={compact ? 14 : 16} strokeWidth={1.7} /></div>
      {!compact && <span className="font-display text-base tracking-[0.16em] text-foreground">ESOTERIC<span className="text-amber-200">CODE</span></span>}
    </div>
  );
}
