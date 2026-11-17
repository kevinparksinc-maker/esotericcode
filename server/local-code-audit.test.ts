import { describe, expect, it } from "vitest";
import { auditRepository } from "./local-code-audit";

describe("offline code audit", () => {
  it("identifies missing relative imports and review markers without an AI service", () => {
    const findings = auditRepository([
      { path: "src/index.ts", bytes: 128, category: "source", content: 'import { x } from "./missing";\n// TODO: verify flow\nconsole.log("debug");' },
      { path: "src/real.ts", bytes: 20, category: "source", content: "export const x = 1;" },
      { path: "package.json", bytes: 30, category: "manifest", content: '{"scripts":{"build":"vite build"}}' },
    ]);
    expect(findings.some(item => item.rule === "unresolved-relative-import" && item.file === "src/index.ts" && item.line === 1)).toBe(true);
    expect(findings.some(item => item.rule === "unfinished-work-marker" && item.line === 2)).toBe(true);
    expect(findings.some(item => item.rule === "missing-test-script")).toBe(true);
  });
  it("keeps comment examples out of executable import and debug findings", () => {
    const findings = auditRepository([{ path: "src/main.ts", bytes: 100, category: "source", content: "/* import \"./ghost\"; console.log(\"example\"); */\\n// import \"./missing\";\\nconst ok = true;" }]);
    expect(findings.some(item => item.rule === "unresolved-relative-import" || item.rule === "debug-logging")).toBe(false);
  });
  it("resolves existing relative imports to index or extension files", () => {
    const findings = auditRepository([
      { path: "src/main.ts", bytes: 32, category: "source", content: 'import "./real"; import "./utils";' },
      { path: "src/real.ts", bytes: 3, category: "source", content: "ok" },
      { path: "src/utils/index.ts", bytes: 3, category: "source", content: "ok" },
    ]);
    expect(findings.some(item => item.rule === "unresolved-relative-import")).toBe(false);
  });
});
