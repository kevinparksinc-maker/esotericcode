import { createGunzip } from "node:zlib";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import * as tar from "tar-stream";
import * as unzipper from "unzipper";
import type { RepositoryArchitecture, RepositoryFileCategory } from "@shared/esoteric";
import { auditRepository } from "./local-code-audit";

type ArchiveEntry = { path: string; bytes: number; content?: string; category: RepositoryFileCategory };
type AnalysisInput = { owner?: string; repo?: string; branch?: string; accessToken?: string; repositoryFiles: number; recentCommitCount: number; mostRecentCommitAt?: string };

const ARCHIVE_COMPRESSED_LIMIT = 24 * 1024 * 1024;
const TEXT_FILE_LIMIT = 96 * 1024;
// Explicit safety ceiling: fail visibly instead of silently claiming complete AI coverage.
const MAX_LLM_BATCHES = 1000;
const MAX_BATCH_CHARS = 12_000;
const MAX_GEMINI_RETRIES = 4;
const GEMINI_REQUEST_TIMEOUT_MS = 60_000;
const GEMINI_CONCURRENCY = 2;
export const ZIP_UPLOAD_LIMIT = 12 * 1024 * 1024;
const ZIP_ENTRY_LIMIT = 1000;
const ZIP_UNCOMPRESSED_LIMIT = 48 * 1024 * 1024;
const NOISE_DIRECTORIES = new Set(["node_modules", "vendor", "dist", "build", ".git", "coverage", ".next", ".turbo", "target", "out", ".cache"]);
const SOURCE_EXTENSIONS = new Set(["ts", "tsx", "js", "jsx", "mjs", "cjs", "py", "go", "rs", "java", "kt", "rb", "php", "cs", "cpp", "c", "h", "swift", "scala", "vue", "svelte", "sh", "sql"]);
const TEXT_EXTENSIONS = new Set(Array.from(SOURCE_EXTENSIONS).concat(["md", "mdx", "txt", "json", "yml", "yaml", "toml", "xml", "html", "css", "scss", "graphql", "gql", "ini", "properties"]));
const MANIFEST_NAMES = new Set(["package.json", "requirements.txt", "pyproject.toml", "cargo.toml", "go.mod", "pom.xml", "build.gradle", "composer.json", "gemfile", "mix.exs"]);
const CONFIG_NAMES = new Set([".env", ".env.example", "tsconfig.json", "vite.config.ts", "vite.config.js", "eslint.config.js", ".eslintrc", "prettier.config.js", "docker-compose.yml", "docker-compose.yaml"]);

function basename(path: string) { return path.split("/").pop()?.toLowerCase() ?? ""; }
function extension(path: string) { return basename(path).split(".").pop()?.toLowerCase() ?? ""; }
function rootModule(path: string) { return path.split("/")[0] || "root"; }
function isNoise(path: string) { return path.split("/").some(segment => NOISE_DIRECTORIES.has(segment)); }
function isSensitive(path: string) { const name = basename(path); return name.startsWith(".env") && name !== ".env.example" || /\.(pem|key|p12|pfx)$/i.test(name) || /credential|secret|private/i.test(name); }
function sanitizeArchivePath(path: string) {
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some(part => part === ".." || part === ".")) return undefined;
  return normalized;
}

export function classifyRepositoryFile(path: string): RepositoryFileCategory {
  const lower = path.toLowerCase();
  const name = basename(path);
  if (/^readme|(^|\/)(docs?|documentation)(\/|$)/i.test(lower) || ["md", "mdx"].includes(extension(path))) return "documentation";
  if (/(^|\/)(tests?|__tests__|specs?)(\/|$)|\.(test|spec)\.[^.]+$/i.test(lower)) return "test";
  if (MANIFEST_NAMES.has(name)) return "manifest";
  if (/(^|\/)(migrations?|prisma|schema)(\/|$)|\.sql$/i.test(lower)) return "migration";
  if (name === "dockerfile" || /(^|\/)(\.github\/workflows|\.gitlab-ci|infra|infrastructure|terraform|k8s|helm)(\/|$)|\.(tf|tfvars)$/i.test(lower)) return "infrastructure";
  if (CONFIG_NAMES.has(name) || name.startsWith(".env") || /(^|\/)(config|configs)(\/|$)|\.(ya?ml|toml|ini|xml)$/i.test(lower)) return "config";
  if (SOURCE_EXTENSIONS.has(extension(path))) return "source";
  return "other";
}

function isTextCandidate(path: string, category: RepositoryFileCategory, bytes: number) {
  return !isSensitive(path) && (TEXT_EXTENSIONS.has(extension(path)) || category !== "other") && (category === "source" || bytes <= TEXT_FILE_LIMIT);
}

async function readLimitedBody(response: Response) {
  if (!response.body) throw new Error("GitHub did not provide an archive body.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > ARCHIVE_COMPRESSED_LIMIT) {
      await reader.cancel();
      throw new Error("The repository archive exceeds the bounded analysis limit.");
    }
    chunks.push(value);
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return Buffer.from(result);
}

export async function parseRepositoryArchive(buffer: Buffer): Promise<{ entries: ArchiveEntry[]; excludedNoiseFiles: number }> {
  const extract = tar.extract();
  const entries: ArchiveEntry[] = [];
  let excludedNoiseFiles = 0;
  await new Promise<void>((resolve, reject) => {
    extract.on("entry", (header, stream, next) => {
      const rawPath = header.name.replace(/^([^/]+)\//, "");
      if (header.type !== "file" || !rawPath) { stream.resume(); stream.on("end", next); return; }
      if (isNoise(rawPath) || /\.(lock|map)$/i.test(rawPath) || ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "composer.lock", "cargo.lock"].includes(basename(rawPath))) {
        excludedNoiseFiles += 1;
        stream.resume(); stream.on("end", next); return;
      }
      const bytes = Number(header.size ?? 0);
      const category = classifyRepositoryFile(rawPath);
      if (!isTextCandidate(rawPath, category, bytes)) {
        entries.push({ path: rawPath, bytes, category });
        stream.resume(); stream.on("end", next); return;
      }
      const chunks: Buffer[] = [];
      let received = 0;
      stream.on("data", (chunk: Buffer) => { received += chunk.length; chunks.push(chunk); });
      stream.on("error", reject);
      stream.on("end", () => { entries.push({ path: rawPath, bytes, category, content: Buffer.concat(chunks).toString("utf8") }); next(); });
    });
    extract.on("finish", resolve);
    extract.on("error", reject);
    Readable.from(buffer).pipe(createGunzip()).pipe(extract).on("error", reject);
  });
  return { entries, excludedNoiseFiles };
}

export async function parseUploadedZip(buffer: Buffer): Promise<{ entries: ArchiveEntry[]; excludedNoiseFiles: number }> {
  if (buffer.length === 0 || buffer.length > ZIP_UPLOAD_LIMIT) throw new Error("ZIP archives must be between 1 byte and 12 MB.");
  const directory = await unzipper.Open.buffer(buffer);
  const archiveFiles = directory.files.filter(file => file.type === "File");
  if (archiveFiles.length === 0) throw new Error("The ZIP archive does not contain files.");
  if (archiveFiles.length > ZIP_ENTRY_LIMIT) throw new Error("The ZIP archive contains too many files for a bounded analysis.");
  const uncompressedTotal = archiveFiles.reduce((sum, file) => sum + Number(file.uncompressedSize ?? 0), 0);
  if (uncompressedTotal > ZIP_UNCOMPRESSED_LIMIT) throw new Error("The ZIP archive expands beyond the 48 MB safety limit.");
  const safePaths = archiveFiles.map(file => sanitizeArchivePath(file.path)).filter((path): path is string => Boolean(path));
  const firstSegments = safePaths.map(path => path.split("/")[0]);
  const sharedRoot = firstSegments.length > 0 && firstSegments.every(segment => segment === firstSegments[0]) && safePaths.some(path => path.includes("/")) ? firstSegments[0] : undefined;
  const entries: ArchiveEntry[] = [];
  let excludedNoiseFiles = 0;
  for (const file of archiveFiles) {
    const safePath = sanitizeArchivePath(file.path);
    if (!safePath) { excludedNoiseFiles += 1; continue; }
    const rawPath = sharedRoot && safePath.startsWith(`${sharedRoot}/`) ? safePath.slice(sharedRoot.length + 1) : safePath;
    if (isNoise(rawPath) || /\.(lock|map)$/i.test(rawPath) || ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "composer.lock", "cargo.lock"].includes(basename(rawPath))) { excludedNoiseFiles += 1; continue; }
    const bytes = Number(file.uncompressedSize ?? 0);
    const category = classifyRepositoryFile(rawPath);
    if (!isTextCandidate(rawPath, category, bytes)) { entries.push({ path: rawPath, bytes, category }); continue; }
    const content = await file.buffer();
    entries.push({ path: rawPath, bytes, category, content: content.toString("utf8") });
  }
  return { entries, excludedNoiseFiles };
}

function extractImports(path: string, content: string) {
  const edges: Array<{ from: string; to: string }> = [];
  const pattern = /(?:from\s+|require\s*\(|import\s*\()["']([^"']+)["']/g;
  let match = pattern.exec(content);
  while (match) {
    const target = match[1];
    if (target.startsWith(".") || target.startsWith("@/")) edges.push({ from: path, to: target });
    match = pattern.exec(content);
  }
  return edges;
}

function parseDependencies(entries: ArchiveEntry[]) {
  const manifest = entries.find(entry => basename(entry.path) === "package.json" && entry.content);
  if (!manifest?.content) return [];
  try {
    const packageJson = JSON.parse(manifest.content) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    return Array.from(new Set([...Object.keys(packageJson.dependencies ?? {}), ...Object.keys(packageJson.devDependencies ?? {})])).sort();
  } catch { return []; }
}

/**
 * Deterministic architecture evidence. No AI is used to inspect files.
 * Pattern matches below are clues for a human review, not verified defects.
 */
function inspectModules(entries: ArchiveEntry[]): RepositoryArchitecture["moduleSummaries"] {
  const groups = new Map<string, ArchiveEntry[]>();
  for (const entry of entries) {
    const group = rootModule(entry.path);
    groups.set(group, [...(groups.get(group) ?? []), entry]);
  }
  return Array.from(groups, ([module, files]) => {
    const counts = { source: 0, test: 0, config: 0, documentation: 0, infrastructure: 0 };
    const importTargets = new Set<string>();
    const flagged: string[] = [];
    for (const file of files) {
      if (file.category in counts) counts[file.category as keyof typeof counts]++;
      if (!file.content) continue;
      for (const edge of extractImports(file.path, file.content)) importTargets.add(edge.to);
      const markerCounts = {
        todo: (file.content.match(/\\bTODO\\b/g) ?? []).length,
        fixme: (file.content.match(/\\bFIXME\\b/g) ?? []).length,
      };
      if (markerCounts.fixme > 0) flagged.push(`${file.path}: ${markerCounts.fixme} FIXME marker(s) (review needed)`);
      if (markerCounts.todo > 0) flagged.push(`${file.path}: ${markerCounts.todo} TODO marker(s) (review needed)`);
    }
    const largest = files.slice().sort((a, b) => b.bytes - a.bytes)[0];
    return {
      module,
      summary: `${module}: ${files.length} files (${counts.source} source, ${counts.test} tests, ${counts.config} config, ${counts.documentation} documentation, ${counts.infrastructure} infrastructure). Largest: ${largest?.path ?? "none"} (${largest?.bytes ?? 0} bytes).`,
      responsibilities: [
        `Contains ${counts.source} source and ${counts.test} test files`,
        `References ${importTargets.size} distinct relative/import-alias targets`,
        `Paths: ${files.slice(0, 8).map(file => file.path).join(", ")}`,
      ],
      risks: flagged.slice(0, 5),
    };
  });
}

async function fetchSelectedFileRecency(input: AnalysisInput, paths: string[]) {
  const { owner, repo, branch } = input;
  if (!owner || !repo || !branch) return paths.slice(0, 8).map(path => ({ path }));
  const selected = paths.slice(0, 8);
  return Promise.all(selected.map(async path => {
    try {
      const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?sha=${encodeURIComponent(branch)}&path=${encodeURIComponent(path)}&per_page=1`, { headers: { Accept: "application/vnd.github+json", "User-Agent": "EsotericCode-oracle", "X-GitHub-Api-Version": "2022-11-28", ...(input.accessToken ? { Authorization: `Bearer ${input.accessToken}` } : {}) } });
      if (!response.ok) return { path };
      const commits = await response.json() as Array<{ commit?: { author?: { date?: string } } }>;
      return { path, lastCommitAt: commits[0]?.commit?.author?.date };
    } catch { return { path }; }
  }));
}

async function buildArchitectureFromEntries(input: AnalysisInput, entries: ArchiveEntry[], excludedNoiseFiles: number): Promise<RepositoryArchitecture> {
  const categories: RepositoryArchitecture["categoryCounts"] = { source: 0, test: 0, config: 0, documentation: 0, manifest: 0, migration: 0, infrastructure: 0, other: 0 };
  for (const entry of entries) categories[entry.category] += 1;
  const dependencies = parseDependencies(entries);
  const topLevelModules = Array.from(new Map(entries.map(entry => [rootModule(entry.path), entries.filter(other => rootModule(other.path) === rootModule(entry.path))])).entries()).map(([path, files]) => ({ path, files: files.length, categories: Array.from(new Set(files.map(file => file.category))) })).sort((a, b) => b.files - a.files).slice(0, 16);
  const entryPoints = entries.filter(entry => /(^|\/)(main|index|app|server|cli)\.(ts|tsx|js|jsx|py|go|rs)$/i.test(entry.path) || basename(entry.path) === "package.json").map(entry => entry.path).slice(0, 20);
  const allImportEdges = entries.flatMap(entry => entry.content ? extractImports(entry.path, entry.content) : []);
  const importEdges = allImportEdges.slice(0, 120);
  const testDirectories = Array.from(new Set(entries.filter(entry => entry.category === "test").map(entry => entry.path.split("/").slice(0, -1).join("/") || "root"))).slice(0, 24);
  const maintenanceMarkers = entries.reduce((result, entry) => { const content = entry.content ?? ""; result.todo += (content.match(/\bTODO\b/gi) ?? []).length; result.fixme += (content.match(/\bFIXME\b/gi) ?? []).length; result.deprecated += (content.match(/\bdeprecated\b/gi) ?? []).length; return result; }, { todo: 0, fixme: 0, deprecated: 0 });
  const largestFiles = entries.slice().sort((a, b) => b.bytes - a.bytes).slice(0, 10).map(entry => ({ path: entry.path, bytes: entry.bytes, category: entry.category }));
  const recentlyTouchedFiles = await fetchSelectedFileRecency(input, largestFiles.map(file => file.path));
  const structured = { analysisMode: "bounded full-tree architecture scan" as const, coverage: { repositoryFiles: input.repositoryFiles, inspectedTextFiles: entries.filter(entry => entry.content).length, excludedNoiseFiles, contentBatches: 0, unprocessedTextFiles: 0, failedBatches: 0 }, categoryCounts: categories, topLevelModules, entryPoints, importEdges, dependencyCount: dependencies.length, dependencies: dependencies.slice(0, 40), testDirectories, maintenanceMarkers, largestFiles, recency: { recentCommitCount: input.recentCommitCount, mostRecentCommitAt: input.mostRecentCommitAt, recentlyTouchedFiles } };
  if (!entries.some(entry => entry.category === "source" && entry.content !== undefined)) {
    throw new Error("No readable source code was found. A code reading requires source files, not GitHub metadata alone.");
  }
  // Canonical digest of the bytes actually inspected; path order and file boundaries are explicit.
  const digest = createHash("sha256");
  for (const entry of entries.filter(e => e.content !== undefined).sort((a, b) => a.path.localeCompare(b.path))) {
    digest.update(Buffer.from(entry.path, "utf8"));
    digest.update(Buffer.from([0]));
    const content = Buffer.from(entry.content!, "utf8");
    digest.update(Buffer.from(String(content.byteLength) + ":", "utf8"));
    digest.update(content);
    digest.update(Buffer.from([0]));
  }
  const sourceFingerprint = digest.digest("hex");
  const moduleSummaries = inspectModules(entries);
  const auditFindings = auditRepository(entries);
  const auditTruncated = auditFindings.length >= 1000;
  structured.coverage.contentBatches = 0; // No Gemini scanning calls.
  structured.coverage.unprocessedTextFiles = entries.filter(entry => entry.category === "source" && entry.content === undefined).length;
  structured.coverage.failedBatches = 0;
  const unifiedSummary = [
    `Local static architecture scan of ${structured.coverage.repositoryFiles} files; ${structured.coverage.inspectedTextFiles} readable text files inspected.`,
    `${categories.source} source, ${categories.test} tests, ${categories.config} configuration, ${categories.documentation} documentation files.`,
    `${allImportEdges.length} internal import edges recorded, showing the first ${importEdges.length}; ${dependencies.length} manifest dependencies.`,
    `Entry points: ${entryPoints.join(", ") || "none detected"}.`,
    `Maintenance markers: ${maintenanceMarkers.todo} TODO, ${maintenanceMarkers.fixme} FIXME, ${maintenanceMarkers.deprecated} deprecated.`,
    `Offline code audit: ${auditFindings.length} review findings, with path and line evidence${auditTruncated ? "; result limit reached and further findings may exist" : ""}.`,
    `These are static observations, not proof that code works or has specific defects.`,
  ].join(" ");
  return { ...structured, sourceFingerprint, moduleSummaries, auditFindings, auditCount: auditFindings.length, auditTruncated, auditMethod: "offline heuristic code audit", unifiedSummary, synthesisMethod: "local static evidence followed by one Gemini interpretation" };

}

export async function analyzeRepositoryArchitecture(input: AnalysisInput): Promise<RepositoryArchitecture> {
  const { owner, repo, branch } = input;
  if (!owner || !repo || !branch) throw new Error("GitHub repository identifiers are required for archive analysis.");
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tarball/${encodeURIComponent(branch)}`, { headers: { Accept: "application/vnd.github+json", "User-Agent": "EsotericCode-oracle", "X-GitHub-Api-Version": "2022-11-28", ...(input.accessToken ? { Authorization: `Bearer ${input.accessToken}` } : {}) } });
  if (!response.ok) throw new Error("GitHub could not provide a source archive for architecture analysis.");
  const archive = await readLimitedBody(response);
  const { entries, excludedNoiseFiles } = await parseRepositoryArchive(archive);
  return buildArchitectureFromEntries(input, entries, excludedNoiseFiles);
}

export async function analyzeUploadedZipArchitecture(archive: Buffer): Promise<RepositoryArchitecture> {
  const { entries, excludedNoiseFiles } = await parseUploadedZip(archive);
  return buildArchitectureFromEntries({ repositoryFiles: entries.length + excludedNoiseFiles, recentCommitCount: 0 }, entries, excludedNoiseFiles);
}
