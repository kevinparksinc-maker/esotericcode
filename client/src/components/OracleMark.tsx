import { Sparkles } from "lucide-react";

export function OracleMark({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3 text-amber-100">
    <span className="oracle-glyph flex h-9 w-9 items-center justify-center rounded-full"><Sparkles className="h-4 w-4" /></span>
    {!compact && <span className="font-serif text-2xl tracking-[0.08em]">Esoteric<span className="text-violet-300">Code</span></span>}
  </div>;
}
