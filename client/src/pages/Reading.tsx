import { useAuth } from "@/_core/hooks/useAuth";
import { MetricBar } from "@/components/MetricBar";
import { OracleMark } from "@/components/OracleMark";
import { TarotCardDetail, TarotCardView } from "@/components/TarotCardView";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import type { KpAstrologyChart } from "@shared/esoteric";
import { ArrowLeft, Check, Copy, ExternalLink, Loader2, Share2, Sparkles } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { useEffect } from "react";

const number = new Intl.NumberFormat("en-US");
const pct = (value: number) => `${Math.round(value * 100)}%`;

export default function Reading() {
  const [, params] = useRoute("/reading/:id");
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const id = Number(params?.id);
  const query = trpc.readings.get.useQuery({ id }, { enabled: isAuthenticated && Number.isFinite(id) });
  const share = trpc.readings.share.useMutation();
  const reading = query.data;
  const shareUrl = reading?.isShared ? `${window.location.origin}/share/${reading.shareSlug}` : null;

  const handleShare = async () => {
    if (!reading) return;
    const result = await share.mutateAsync({ id: reading.id });
    const url = `${window.location.origin}/share/${result.shareSlug}`;
    await navigator.clipboard?.writeText(url);
    query.refetch();
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) setLocation("/");
  }, [isAuthenticated, loading, setLocation]);

  if (loading || query.isLoading) return <LoadingState />;
  if (!isAuthenticated) return <AccessRedirect />;
  if (query.isError) return <ReadingRequestError onRetry={() => query.refetch()} />;
  if (!reading) return <NotFoundReading />;
  const { metrics, tarot, iching } = reading;
  const kp = metrics.kpChart;

  return (
    <div className="oracle-shell min-h-screen">
      <header className="page-header"><Link href="/" className="focus-ring"><OracleMark /></Link><div className="flex items-center gap-2"><Link href="/history"><Button variant="ghost" className="text-slate-300 hover:bg-white/5 hover:text-white">Archive</Button></Link><Button className="mystic-button h-10" onClick={handleShare} disabled={share.isPending}>{share.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : shareUrl ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}{shareUrl ? "Link copied" : "Share reading"}</Button></div></header>
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-10 md:px-8">
        <div className="fade-up flex flex-col gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div><p className="eyebrow">Repository reading · {new Date(reading.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p><h1 className="mt-3 font-display text-4xl text-amber-50 md:text-6xl">{metrics.owner}<span className="text-violet-300">/</span>{metrics.name}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{metrics.description || "A codebase examined through the converging lenses of architecture and archetype."}</p></div><a href={metrics.repositoryUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 self-start font-mono text-xs text-violet-200 transition hover:text-amber-200 md:self-auto">OPEN REPOSITORY <ExternalLink className="h-3.5 w-3.5" /></a></div>
        {shareUrl && <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-emerald-300/20 bg-emerald-200/[0.05] px-4 py-3 text-sm text-emerald-100"><span className="truncate">Public link active: {shareUrl}</span><button className="focus-ring shrink-0 text-emerald-200" onClick={() => navigator.clipboard?.writeText(shareUrl)} aria-label="Copy sharing link"><Copy className="h-4 w-4" /></button></div>}
        <section className="mt-12 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="oracle-narrative fade-up"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-200" /><span className="eyebrow">The oracle speaks</span></div><p className="mt-6 font-display text-2xl leading-[1.55] text-amber-50 md:text-3xl">{reading.narrative}</p></div>
          <aside className="panel p-6 fade-up"><p className="eyebrow">Structural constellation</p><div className="mt-5 space-y-5"><MetricBar label="Complexity" value={metrics.complexityScore * 15} detail={metrics.complexityLevel.toUpperCase()} tone={metrics.complexityLevel === "high" ? "rose" : "violet"} /><MetricBar label="Test signal" value={metrics.testRatio * 100} detail={pct(metrics.testRatio)} tone="amber" /><MetricBar label="Commit current" value={Math.min(metrics.recentCommitCount * 5, 100)} detail={`${metrics.recentCommitCount} / 30D`} /><MetricBar label="Contributor orbit" value={Math.min(metrics.contributorCount * 10, 100)} detail={number.format(metrics.contributorCount)} tone="amber" /></div></aside>
        </section>
        <section className="mt-16"><div className="section-heading"><div><p className="eyebrow">Tarot spread</p><h2 className="font-display text-3xl text-amber-50">Three faces of the system</h2></div><span className="font-mono text-xs text-slate-500">01 — 03</span></div><div className="mt-8 grid gap-5 md:grid-cols-3">{tarot.map((card, index) => <TarotCardView key={`${card.position}-${card.cardName}`} card={card} index={index} />)}</div><div className="mt-5 grid gap-5 md:grid-cols-3">{tarot.map(card => <TarotCardDetail key={`${card.position}-detail`} card={card} />)}</div></section>
        <section className="mt-16 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]"><div className="hexagram-card"><p className="eyebrow text-violet-100/70">I Ching</p><div className="my-7"><div className="hexagram-symbol">☷</div><p className="font-mono text-xs tracking-[0.28em] text-amber-200">{iching.chineseName}</p></div><p className="font-display text-3xl text-amber-50">{iching.number}. {iching.name}</p></div><div className="panel p-7"><p className="eyebrow">The governing hexagram</p><blockquote className="mt-5 border-l border-amber-300/70 pl-5 font-display text-xl italic leading-relaxed text-amber-50">“{iching.classicalText}”</blockquote><p className="mt-6 text-sm leading-7 text-slate-300">{iching.developerInterpretation}</p><p className="mt-5 font-mono text-xs leading-5 text-violet-200">SIGNAL: {iching.trigger}</p></div></section>
        <section className="mt-16 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]"><div className="hexagram-card"><p className="eyebrow text-violet-100/70">I Ching</p><div className="my-7"><div className="hexagram-symbol">{iching.symbol ?? "☷"}</div><p className="font-mono text-xs tracking-[0.28em] text-amber-200">{iching.chineseName}</p></div><p className="font-display text-3xl text-amber-50">{iching.number}. {iching.name}</p></div><div className="panel p-7"><p className="eyebrow">The governing hexagram</p><blockquote className="mt-5 border-l border-amber-300/70 pl-5 font-display text-xl italic leading-relaxed text-amber-50">“{iching.classicalText}”</blockquote><p className="mt-6 text-sm leading-7 text-slate-300">{iching.developerInterpretation}</p><p className="mt-5 font-mono text-xs leading-5 text-violet-200">SIGNAL: {iching.trigger}</p></div></section>
        {kp && <KpPanel chart={kp} />}
        <section className="mt-16"><div className="section-heading"><div><p className="eyebrow">Evidence ledger</p><h2 className="font-display text-3xl text-amber-50">What the system revealed</h2></div></div><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Evidence label="Source files" value={number.format(metrics.sourceFileCount)} /><Evidence label="Directory depth" value={`${metrics.directoryDepth} levels`} /><Evidence label="Largest source file" value={`${(metrics.largestSourceFileSize / 1000).toFixed(1)} KB`} /><Evidence label="Commit pace" value={`${metrics.averageCommitsPerWeek} / week`} /></div><div className="mt-4 panel p-5"><p className="eyebrow">Observed signals</p><ul className="mt-3 space-y-2">{metrics.complexitySignals.map(signal => <li key={signal} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />{signal}</li>)}</ul></div></section>
      </main>
    </div>
  );
}

function Evidence({ label, value }: { label: string; value: string }) { return <div className="panel p-5"><p className="eyebrow">{label}</p><p className="mt-3 font-display text-2xl text-amber-50">{value}</p></div>; }
function KpPanel({ chart }: { chart: KpAstrologyChart }) { return <section className="kp-section mt-16"><div className="section-heading"><div><p className="eyebrow">KP correspondence layer</p><h2 className="font-display text-3xl text-amber-50">The repository’s symbolic chart</h2></div><span className="font-mono text-[10px] text-slate-500">KP-INSPIRED · NOT A NATAL CHART</span></div><div className="mt-7 grid gap-5 lg:grid-cols-[.85fr_1.15fr]"><div className="kp-chart-card"><div className="kp-orbit"><span className="kp-orbit__ring kp-orbit__ring--outer" /><span className="kp-orbit__ring kp-orbit__ring--inner" /><span className="kp-orbit__planet kp-orbit__planet--star">{chart.starLord.symbol}</span><span className="kp-orbit__planet kp-orbit__planet--sub">{chart.subLord.symbol}</span><span className="kp-orbit__core">{chart.nakshatra.index}</span></div><p className="mt-6 font-mono text-[10px] tracking-[.16em] text-amber-200">NAKSHATRA {String(chart.nakshatra.index).padStart(2, "0")}</p><h3 className="mt-2 font-display text-3xl text-amber-50">{chart.nakshatra.name}</h3><p className="mt-3 text-sm leading-6 text-slate-300">{chart.nakshatra.theme}</p><p className="mt-5 font-mono text-[10px] leading-5 text-slate-500">Repository birth: {new Date(chart.repositoryBirth.createdAt).toLocaleDateString()} · {chart.repositoryBirth.ageDays.toLocaleString()} days in orbit</p></div><div className="grid gap-4 sm:grid-cols-2"><KpFactor label="Active house" title={`${chart.activeHouse.number}. ${chart.activeHouse.name}`} body={`${chart.activeHouse.engineeringDomain} — ${chart.activeHouse.theme}`} /><KpFactor label="Star lord" title={`${chart.starLord.symbol} ${chart.starLord.planet}`} body={chart.starLord.engineeringFocus} /><KpFactor label="Sub-lord" title={`${chart.subLord.symbol} ${chart.subLord.planet}`} body={chart.subLord.engineeringFocus} /><div className="kp-factor sm:col-span-2"><p className="eyebrow">Three-system bridge</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><p className="font-mono text-[10px] text-violet-200">TAROT RESONANCES</p><div className="mt-2 flex flex-wrap gap-2">{chart.tarotBridge.map(card => <span key={card} className="kp-chip">{card}</span>)}</div></div><div><p className="font-mono text-[10px] text-violet-200">I CHING RESONANCES</p><div className="mt-2 flex flex-wrap gap-2">{chart.ichingBridge.map(hexagram => <span key={hexagram.number} className="kp-chip">{hexagram.number}. {hexagram.name}</span>)}</div></div></div></div></div></div><div className="kp-synthesis mt-5"><p className="eyebrow">Integrated reading</p><p className="mt-4 font-display text-xl leading-relaxed text-amber-50">{chart.synthesis}</p><p className="mt-5 font-mono text-[10px] leading-5 text-slate-500">{chart.disclaimer}</p></div></section>; }
function KpFactor({ label, title, body }: { label: string; title: string; body: string }) { return <div className="kp-factor"><p className="eyebrow">{label}</p><h3 className="mt-3 font-display text-2xl text-amber-50">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-300">{body}</p></div>; }
function LoadingState() { return <div className="oracle-shell flex min-h-screen items-center justify-center"><div className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-200" /><p className="mt-4 font-mono text-xs text-slate-400">CONSULTING THE ARCHIVE…</p></div></div>; }
function AccessRedirect() { return <div className="oracle-shell flex min-h-screen items-center justify-center p-6"><div className="max-w-md text-center"><p className="eyebrow">Returning to the oracle</p><p className="mt-3 text-sm leading-6 text-slate-400">Your session needs to be refreshed before this reading can be opened.</p><Link href="/"><Button className="mystic-button mt-6">Open EsotericCode</Button></Link></div></div>; }
function ReadingRequestError({ onRetry }: { onRetry: () => void }) { return <div className="oracle-shell flex min-h-screen items-center justify-center p-6"><div className="max-w-md text-center"><p className="eyebrow">The archive did not answer</p><h1 className="mt-4 font-display text-4xl text-amber-50">This reading could not be loaded.</h1><p className="mt-3 text-sm leading-6 text-slate-400">The request stopped rather than leaving you on a permanent spinner. Try again, or return to the oracle.</p><div className="mt-7 flex justify-center gap-3"><Button variant="outline" onClick={onRetry}>Try again</Button><Link href="/"><Button className="mystic-button">Return home</Button></Link></div></div></div>; }
function NotFoundReading() { return <div className="oracle-shell flex min-h-screen items-center justify-center p-6"><div className="max-w-md text-center"><p className="eyebrow">The thread has gone quiet</p><h1 className="mt-4 font-display text-4xl text-amber-50">This reading is not in your archive.</h1><Link href="/"><Button className="mystic-button mt-7"><ArrowLeft className="mr-2 h-4 w-4" />Return to the oracle</Button></Link></div></div>; }
