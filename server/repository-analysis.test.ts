import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeGitHubRepository, parseGitHubRepositoryUrl } from "./repository-analysis";

describe("repository analysis", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalizes supported GitHub URL forms", () => {
    expect(parseGitHubRepositoryUrl("github.com/octo/oracle/")).toEqual({ owner: "octo", repository: "oracle", normalizedUrl: "https://github.com/octo/oracle" });
    expect(() => parseGitHubRepositoryUrl("https://example.com/not-github")).toThrow("Enter a GitHub repository URL");
  });

  it("derives measurable metrics and structural evidence from GitHub responses", async () => {
    const response = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response({ full_name: "octo/oracle", name: "oracle", owner: { login: "octo" }, html_url: "https://github.com/octo/oracle", default_branch: "main", description: "A test repository", language: "TypeScript" }))
      .mockResolvedValueOnce(response({ truncated: false, tree: [
        { path: "client/src/main.tsx", type: "blob", size: 250 },
        { path: "server/index.ts", type: "blob", size: 480 },
        { path: "server/oracle.test.ts", type: "blob", size: 160 },
        { path: "README.md", type: "blob", size: 120 },
      ] }))
      .mockResolvedValueOnce(response([{}, {}]))
      .mockResolvedValueOnce(response([{}, {}, {}])));

    const result = await analyzeGitHubRepository("https://github.com/octo/oracle", "public");

    expect(result.metrics).toMatchObject({ owner: "octo", name: "oracle", fileCount: 4, sourceFileCount: 3, testFileCount: 1, testRatio: 0.33, contributorCount: 2, recentCommitCount: 3, source: "public" });
    expect(result.architecture.entryPoints).toContain("client/src/main.tsx");
    expect(result.architecture.topModules[0]).toEqual({ path: "server", files: 2 });
  });

  it("keeps the reading available when optional enrichment endpoints fail", async () => {
    const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response({ full_name: "octo/oracle", name: "oracle", owner: { login: "octo" }, html_url: "https://github.com/octo/oracle", default_branch: "main", description: null, language: null }))
      .mockResolvedValueOnce(response({ truncated: false, tree: [{ path: "README.md", type: "blob", size: 120 }] }))
      .mockResolvedValueOnce(response({ message: "rate limited" }, 403))
      .mockResolvedValueOnce(response({ message: "rate limited" }, 403)));

    const result = await analyzeGitHubRepository("https://github.com/octo/oracle", "public");

    expect(result.metrics.fileCount).toBe(1);
    expect(result.metrics.contributorCount).toBe(0);
    expect(result.metrics.recentCommitCount).toBe(0);
  });
});
