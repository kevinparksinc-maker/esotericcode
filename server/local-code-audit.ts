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
  const incoming = new Map<string, Set<string>>();
  const outgoing = new Map<string, Array<{ to: string; line: number }>>();
  function add(rule: string, severity: RepositoryAuditFinding["severity"], file: string, line: number, evidence: string, recommendation: string) {
    if (findings.length >= 1000) return;
    findings.push({ rule, severity, file, line, evidence: evidence.slice(0, 180), recommendation, status: "requires-verification" });
  }
  for (const entry of entries) {
    if (entry.category !== "source" && entry.category !== "config" && entry.category !== "manifest" && entry.category !== "test") continue;
    if (entry.content === undefined) continue;
    // Preserve line positions while removing comments before searching for executable constructs.
    const uncommented = entry.content.replace(/\/\*[\s\S]*?\*\/|^\s*\/\/[^\n]*/gm, segment => segment.replace(/[^\n]/g, " "));
    const lines = uncommented.split(/\r?\n/);
    const originalLines = entry.content.split(/\r?\n/);
    if (sourceExt.test(entry.path)) {
      const imports = new RegExp(importPattern.source, "g");
      let match: RegExpExecArray | null;
      while ((match = imports.exec(uncommented)) !== null) {
        const target = match[1];
        if (!target.startsWith(".")) continue; // aliases and workspace imports need config resolution
        const base = path.normalize(path.join(path.dirname(entry.path), target));
        if (!incoming.has(base)) incoming.set(base, new Set());
        incoming.get(base)!.add(entry.path);
        const resolved = [base, ...candidates.map(ext => base + ext)].find(candidate => known.has(candidate));
        const line = uncommented.slice(0, match.index).split("\n").length;
        if (resolved) {
          outgoing.set(entry.path, [...(outgoing.get(entry.path) ?? []), { to: resolved, line }]);
        } else {
          add("unresolved-relative-import", "warning", entry.path, line, target, "Verify the relative path and whether the target is present in the archive.");
        }
      }
    }
    for (let index = 0; index < lines.length; index++) {
      const text = lines[index];
      const original = originalLines[index] ?? text;
      const line = index + 1;
      if (/\b(?:TODO|FIXME)\b/i.test(original) && !/https?:\/\//.test(original)) {
        add("unfinished-work-marker", "info", entry.path, line, original.trim(), "Review the marked work; it is not automatically a defect.");
      }
      if (/\b(?:eval\s*\(|new\s+Function\s*\()/.test(text) && !/\/\/|\/\*/.test(text.trim().slice(0, 3))) {
        add("dynamic-code-execution", "warning", entry.path, line, original.trim(), "Check whether untrusted input can reach dynamic execution.");
      }
      if (/\bconsole\.(?:log|debug)\s*\(/.test(text) && !/\.test\.|\.spec\./.test(entry.path)) {
        add("debug-logging", "info", entry.path, line, original.trim(), "Confirm logging avoids credentials and sensitive values.");
      }
      if (/\b(?:catch\s*\([^)]*\)\s*\{\s*\}|catch\s*\{\s*\})/.test(text)) {
        add("empty-catch-block", "warning", entry.path, line, original.trim(), "Check whether a swallowed error hides a failed operation.");
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
  // Trace static relative import cycles across files. Cycles are architectural review
  // findings; they do not, by themselves, establish a runtime failure.
  const visited = new Set<string>();
  const active = new Set<string>();
  const stack: string[] = [];
  const reported = new Set<string>();
  function walk(file: string) {
    if (stack.length > 1000) return;
    visited.add(file);
    active.add(file);
    stack.push(file);
    for (const edge of outgoing.get(file) ?? []) {
      if (active.has(edge.to)) {
        const cycle = [...stack.slice(stack.indexOf(edge.to)), edge.to];
        const signature = cycle.slice(0, -1).slice().sort().join("|");
        if (!reported.has(signature)) {
          reported.add(signature);
          add("circular-relative-dependency", "warning", file, edge.line, cycle.join(" -> "), "Trace module initialization and import-time side effects; break the cycle if it causes unsafe initialization or coupled ownership.");
        }
      } else if (!visited.has(edge.to)) walk(edge.to);
    }
    stack.pop();
    active.delete(file);
  }
  for (const file of Array.from(outgoing.keys())) if (!visited.has(file)) walk(file);
  for (const finding of findings) {
    const base = finding.file.replace(/\.[^/.]+$/, "");
    finding.relatedFiles = Array.from(incoming.get(base) ?? []).slice(0, 12);
  }
  return findings.sort((a, b) => ({ warning: 0, info: 1 }[a.severity] - { warning: 0, info: 1 }[b.severity]));
}
