import { posix as path } from "node:path";
import type { RepositoryAuditFinding, RepositoryFileCategory } from "@shared/esoteric";

type Entry = { path: string; content?: string; category: RepositoryFileCategory; bytes: number };
const sourceExt = /\.(?:tsx?|jsx?|mjs|cjs|vue|svelte)$/i;
const candidates = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".vue", ".svelte", ".json", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];
const importPattern = /(?:\b(?:import|export)\s+(?:[^"']*?\s+from\s+)?|\brequire\s*\(|\bimport\s*\()\s*["']([^"']+)["']/g;

/** Bounded, offline heuristic audit. Findings are review candidates, not proof of runtime failure. */
export function auditRepository(entries: Entry[]): RepositoryAuditFinding[] {
  const findings: RepositoryAuditFinding[] = [];
  const known = new Set(entries.map(e => e.path.replace(/\\/g, "/")));
  function add(rule: string, severity: RepositoryAuditFinding["severity"], file: string, line: number, evidence: string, recommendation: string) {
    if (findings.length >= 200) return;
    findings.push({ rule, severity, file, line, evidence: evidence.slice(0, 180), recommendation });
  }
  for (const entry of entries) {
    if (entry.category !== "source" && entry.category !== "config" && entry.category !== "manifest" && entry.category !== "test") continue;
    if (entry.content === undefined) continue;
    const lines = entry.content.split(/\r?\n/);
    if (sourceExt.test(entry.path)) {
      const imports = new RegExp(importPattern.source, "g");
      for (const match of entry.content.matchAll(imports)) {
        const target = match[1];
        if (!target.startsWith(".")) continue; // aliases and workspace imports need config resolution
        const base = path.normalize(path.join(path.dirname(entry.path), target));
        const resolved = [base, ...candidates.map(ext => base + ext)].some(candidate => known.has(candidate));
        if (!resolved) {
          const line = entry.content.slice(0, match.index).split("\n").length;
          add("unresolved-relative-import", "warning", entry.path, line, target, "Verify the relative path and whether the target is present in the archive.");
        }
      }
    }
    for (let index = 0; index < lines.length; index++) {
      const text = lines[index];
      const line = index + 1;
      if (/\b(?:TODO|FIXME)\b/i.test(text) && !/https?:\/\//.test(text)) {
        add("unfinished-work-marker", "info", entry.path, line, text.trim(), "Review the marked work; it is not automatically a defect.");
      }
      if (/\b(?:eval\s*\(|new\s+Function\s*\()/.test(text) && !/\/\/|\/\*/.test(text.trim().slice(0, 3))) {
        add("dynamic-code-execution", "warning", entry.path, line, text.trim(), "Check whether untrusted input can reach dynamic execution.");
      }
      if (/\bconsole\.(?:log|debug)\s*\(/.test(text) && !/\.test\.|\.spec\./.test(entry.path)) {
        add("debug-logging", "info", entry.path, line, text.trim(), "Confirm logging avoids credentials and sensitive values.");
      }
      if (/\b(?:catch\s*\([^)]*\)\s*\{\s*\}|catch\s*\{\s*\})/.test(text)) {
        add("empty-catch-block", "warning", entry.path, line, text.trim(), "Check whether a swallowed error hides a failed operation.");
      }
    }
    if (entry.path.endsWith("package.json")) {
      try {
        const json = JSON.parse(entry.content) as { scripts?: Record<string, string> };
        if (!json.scripts?.test) add("missing-test-script", "info", entry.path, 1, "package.json has no test script", "Consider adding a repeatable test command.");
      } catch {
        add("invalid-package-json", "warning", entry.path, 1, "package.json could not be parsed", "Validate JSON syntax.");
      }
    }
  }
  return findings.sort((a, b) => ({ warning: 0, info: 1 }[a.severity] - { warning: 0, info: 1 }[b.severity]));
}
