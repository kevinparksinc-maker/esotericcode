import { createGzip } from "node:zlib";
import * as tar from "tar-stream";
import { describe, expect, it } from "vitest";
import { parseRepositoryArchive } from "./repository-analysis";

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
});
