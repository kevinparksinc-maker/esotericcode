import { createGzip } from "node:zlib";
import * as tar from "tar-stream";
import { describe, expect, it } from "vitest";
import * as yazl from "yazl";
import { parseRepositoryArchive, parseUploadedZip } from "./repository-analysis";
import { extractUploadedZipMetrics } from "./esoteric";

async function buildFixtureArchive() {
  const pack = tar.pack();
  const gzip = createGzip();
  const chunks: Buffer[] = [];
  const finished = new Promise<Buffer>((resolve, reject) => {
    gzip.on("data", (chunk: Buffer) => chunks.push(chunk));
    gzip.on("end", () => resolve(Buffer.concat(chunks)));
    gzip.on("error", reject);
  });
  pack.pipe(gzip);
  pack.entry({ name: "fixture/src/main.ts" }, "export const entry = true;");
  pack.entry({ name: "fixture/docs/README.md" }, "# Architecture");
  pack.entry({ name: "fixture/.github/workflows/ci.yml" }, "name: CI");
  pack.entry({ name: "fixture/db/migrations/001_init.sql" }, "create table readings (id int);");
  pack.entry({ name: "fixture/package.json" }, "{\"dependencies\":{\"zod\":\"1.0.0\"}}");
  pack.entry({ name: "fixture/node_modules/example/index.js" }, "ignored");
  pack.entry({ name: "fixture/pnpm-lock.yaml" }, "ignored");
  pack.finalize();
  return finished;
}

async function buildFixtureZip() {
  const zip = new yazl.ZipFile();
  const chunks: Buffer[] = [];
  const finished = new Promise<Buffer>((resolve, reject) => {
    zip.outputStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    zip.outputStream.on("end", () => resolve(Buffer.concat(chunks)));
    zip.outputStream.on("error", reject);
  });
  zip.addBuffer(Buffer.from("export const entry = true;"), "fixture/src/main.ts");
  zip.addBuffer(Buffer.from("# Architecture"), "fixture/docs/README.md");
  zip.addBuffer(Buffer.from("name: CI"), "fixture/.github/workflows/ci.yml");
  zip.addBuffer(Buffer.from("ignored"), "fixture/node_modules/example/index.js");
  zip.addBuffer(Buffer.from("ignored"), "fixture/pnpm-lock.yaml");
  zip.end();
  return finished;
}

describe("repository architecture ingestion", () => {
  it("walks relevant repository files while excluding generated and lockfile noise", async () => {
    const archive = await buildFixtureArchive();
    const result = await parseRepositoryArchive(archive);
    expect(result.excludedNoiseFiles).toBe(2);
    expect(result.entries.map(entry => entry.path)).toEqual(expect.arrayContaining(["src/main.ts", "docs/README.md", ".github/workflows/ci.yml", "db/migrations/001_init.sql", "package.json"]));
    expect(result.entries.find(entry => entry.path === "src/main.ts")?.category).toBe("source");
    expect(result.entries.find(entry => entry.path === "docs/README.md")?.category).toBe("documentation");
    expect(result.entries.find(entry => entry.path === ".github/workflows/ci.yml")?.category).toBe("infrastructure");
    expect(result.entries.find(entry => entry.path === "db/migrations/001_init.sql")?.category).toBe("migration");
    expect(result.entries.find(entry => entry.path === "package.json")?.content).toContain("zod");
  });

  it("normalizes an uploaded ZIP root and applies the same noise filtering and classifications", async () => {
    const result = await parseUploadedZip(await buildFixtureZip());
    expect(result.excludedNoiseFiles).toBe(2);
    expect(result.entries.map(entry => entry.path)).toEqual(expect.arrayContaining(["src/main.ts", "docs/README.md", ".github/workflows/ci.yml"]));
    expect(result.entries.find(entry => entry.path === "src/main.ts")?.category).toBe("source");
    expect(result.entries.find(entry => entry.path === "docs/README.md")?.category).toBe("documentation");
    expect(result.entries.find(entry => entry.path === ".github/workflows/ci.yml")?.category).toBe("infrastructure");
  });

  it("rejects a non-ZIP upload before any architecture content is processed", async () => {
    await expect(parseUploadedZip(Buffer.from("this is not a ZIP archive"))).rejects.toThrow();
  });

  it("runs a real ZIP archive through the shared architecture, metrics, and KP-ready analysis path", async () => {
    const metrics = await extractUploadedZipMetrics("fixture.zip", await buildFixtureZip());
    expect(metrics.source).toEqual({ type: "zip", label: "Uploaded ZIP archive", originalFileName: "fixture.zip" });
    expect(metrics.architecture?.coverage.inspectedTextFiles).toBeGreaterThan(0);
    expect(metrics.architecture?.categoryCounts.source).toBe(1);
    expect(metrics.architecture?.categoryCounts.documentation).toBe(1);
    expect(metrics.kpChart?.framework).toBe("Repository symbolic chart");
  }, 90_000);
});
