import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { OracleMark } from "@/components/OracleMark";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { ArrowDown, ArrowUpRight, FileArchive, Github, Loader2, Sparkles, Stars } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

type IntakeSource = "github" | "zip";
const MAX_ZIP_BYTES = 12 * 1024 * 1024;

async function fileToBase64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
}

export default function Home() {
  const { isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [source, setSource] = useState<IntakeSource>(() => new URLSearchParams(window.location.search).get("source") === "zip" ? "zip" : "github");
  const [repoUrl, setRepoUrl] = useState("");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const createReading = trpc.readings.create.useMutation({ onSuccess: result => setLocation(`/reading/${result.id}`) });
  const createZipReading = trpc.readings.createFromZip.useMutation({ onSuccess: result => setLocation(`/reading/${result.id}`) });
  const pending = createReading.isPending || createZipReading.isPending;
  const error = uploadError ?? createReading.error?.message ?? createZipReading.error?.message;
  const enterOracle = () => document.getElementById("oracle-form")?.scrollIntoView({ behavior: "smooth", block: "center" });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setUploadError(null);
    if (!isAuthenticated) { startLogin(); return; }
    if (source === "github") { createReading.mutate({ repositoryUrl: repoUrl }); return; }
    if (!zipFile) { setUploadError("Choose a repository ZIP archive before drawing the spread."); return; }
    if (!/\.zip$/i.test(zipFile.name)) { setUploadError("Upload a .zip repository archive."); return; }
    if (zipFile.size > MAX_ZIP_BYTES) { setUploadError("ZIP archives must be 12 MB or smaller."); return; }
    try {
      const archiveBase64 = await fileToBase64(zipFile);
      createZipReading.mutate({ fileName: zipFile.name, archiveBase64 });
    } catch { setUploadError("The ZIP archive could not be prepared for analysis. Please try another archive."); }
  };

  return <div className="oracle-shell min-h-screen overflow-hidden"><div className="star-field" aria-hidden="true" /><div className="hero-orb hero-orb--one" aria-hidden="true" /><div className="hero-orb hero-orb--two" aria-hidden="true" /><header className="page-header relative z-10"><OracleMark />{isAuthenticated ? <div className="flex items-center gap-2"><Link href="/history"><Button variant="ghost" className="text-slate-300 hover:bg-white/5 hover:text-white">Archive</Button></Link><button onClick={logout} className="hidden font-mono text-[11px] text-slate-500 transition hover:text-slate-300 sm:block">SIGN OUT</button></div> : <Button variant="ghost" onClick={startLogin} className="text-slate-300 hover:bg-white/5 hover:text-white">Enter archive <ArrowUpRight className="ml-2 h-4 w-4" /></Button>}</header><main className="relative z-10"><section className="mx-auto flex min-h-[680px] max-w-6xl flex-col items-center justify-center px-5 pb-20 pt-14 text-center md:px-8"><div className="eyebrow flex items-center gap-2"><Stars className="h-3.5 w-3.5 text-amber-200" />A DIVINATION ENGINE FOR DEVELOPERS</div><h1 className="hero-title mt-7 max-w-5xl">Read the hidden <em>architecture</em><br />of your code.</h1><p className="mt-7 max-w-xl text-base leading-7 text-slate-300 md:text-lg">EsotericCode turns your repository’s signals into a Tarot spread, I Ching counsel, and a technical oracle reading — to help you see the system from another angle.</p><div className="mt-9 flex flex-col items-center gap-3 sm:flex-row"><Button className="mystic-button h-12 px-6" onClick={enterOracle}><Sparkles className="mr-2 h-4 w-4" />Begin a reading</Button><a href="#method" className="quiet-button">How the oracle works <ArrowDown className="ml-2 h-4 w-4" /></a></div><div className="hero-compass mt-16"><span className="compass-ring compass-ring--outer" /><span className="compass-ring compass-ring--middle" /><span className="compass-ray compass-ray--one" /><span className="compass-ray compass-ray--two" /><span className="compass-core"><Github className="h-5 w-5" /></span><span className="compass-label compass-label--top">SYSTEM</span><span className="compass-label compass-label--bottom">SYMBOL</span></div></section><section id="oracle-form" className="relative mx-auto max-w-4xl px-5 pb-24 md:px-8"><div className="form-sigil"><div className="panel relative overflow-hidden p-6 md:p-9"><div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" /><div className="relative"><div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="eyebrow">Open the repository</p><h2 className="mt-2 font-display text-3xl text-amber-50">Consult the codebase</h2></div><span className="font-mono text-[10px] tracking-[0.18em] text-slate-500">GITHUB URL OR PRIVATE ZIP ARCHIVE</span></div><div className="source-tabs mt-6" role="tablist" aria-label="Repository source"><button type="button" role="tab" aria-selected={source === "github"} className={source === "github" ? "is-active" : ""} onClick={() => { setSource("github"); setUploadError(null); }}><Github className="h-4 w-4" />Public GitHub URL</button><button type="button" role="tab" aria-selected={source === "zip"} className={source === "zip" ? "is-active" : ""} onClick={() => { setSource("zip"); setUploadError(null); }}><FileArchive className="h-4 w-4" />Upload ZIP archive</button></div><form onSubmit={submit} className="mt-5">{source === "github" ? <><label className="sr-only" htmlFor="repo-url">GitHub repository URL</label><div className="flex flex-col gap-3 sm:flex-row"><div className="input-shell flex-1"><Github className="h-4 w-4 text-violet-200" /><input id="repo-url" required value={repoUrl} onChange={event => setRepoUrl(event.target.value)} placeholder="github.com/owner/repository" autoComplete="url" /></div><DrawButton pending={pending} /></div></> : <><label htmlFor="repo-zip" className="zip-dropzone"><FileArchive className="h-6 w-6 text-amber-200" /><span className="font-display text-lg text-amber-50">{zipFile ? zipFile.name : "Choose a repository ZIP"}</span><span className="text-xs leading-5 text-slate-400">{zipFile ? `${(zipFile.size / 1024 / 1024).toFixed(2)} MB · ready for a bounded full-tree scan` : "Up to 12 MB. Generated folders, lockfiles, and sensitive files are excluded from content synthesis."}</span><input id="repo-zip" type="file" accept=".zip,application/zip,application/x-zip-compressed" className="sr-only" onChange={event => { const file = event.target.files?.[0] ?? null; setZipFile(file); setUploadError(null); }} /></label><div className="mt-3 flex justify-end"><DrawButton pending={pending} /></div></>}</form>{error && <p className="mt-4 rounded-lg border border-rose-300/20 bg-rose-300/5 px-3 py-2 text-sm text-rose-200">{error}</p>}<p className="mt-4 text-xs leading-5 text-slate-500">{isAuthenticated ? source === "github" ? "Public GitHub metadata and a bounded architecture scan will be saved privately to your archive." : "The uploaded ZIP is stored privately with the reading. Its contents are evaluated server-side in bounded batches; credentials and sensitive files are excluded from synthesis." : "Sign in to preserve a reading, upload a ZIP archive, create a private archive, and share the result when you are ready."}</p></div></div></div></section><section id="method" className="mx-auto max-w-6xl px-5 pb-28 md:px-8"><div className="section-heading"><div><p className="eyebrow">The method</p><h2 className="mt-2 font-display text-4xl text-amber-50">Two languages. One system.</h2></div><p className="max-w-sm text-sm leading-6 text-slate-400">The oracle is a lateral-thinking layer, not a substitute for disciplined engineering judgment.</p></div><div className="mt-8 grid gap-4 md:grid-cols-3"><Method number="01" title="Observe" copy="EsotericCode maps the full repository structure, configuration, tests, dependencies, and architectural signals." /><Method number="02" title="Translate" copy="Deterministic rules map those signals to Tarot archetypes and a full six-line I Ching cast." /><Method number="03" title="Act" copy="One unified technical synthesis connects the symbolic reading to practical engineering action." /></div></section></main><footer className="relative z-10 border-t border-white/[0.07] px-5 py-7 md:px-8"><div className="mx-auto flex max-w-6xl flex-col gap-2 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span className="font-mono">ESOTERICCODE · AN INSTRUMENT FOR PATTERN RECOGNITION</span><span>Built for the code that keeps becoming.</span></div></footer></div>;
}

function DrawButton({ pending }: { pending: boolean }) { return <Button type="submit" className="mystic-button h-12 px-5" disabled={pending}>{pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reading signals…</> : <><Sparkles className="mr-2 h-4 w-4" />Draw the spread</>}</Button>; }
function Method({ number, title, copy }: { number: string; title: string; copy: string }) { return <article className="method-card"><span className="font-mono text-xs text-amber-200">{number}</span><h3 className="mt-8 font-display text-2xl text-amber-50">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p></article>; }
