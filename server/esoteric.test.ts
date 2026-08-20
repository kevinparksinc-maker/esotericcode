import { describe, expect, it } from "vitest";
import { createDivination, parseGitHubRepositoryUrl } from "./esoteric";
import type { RepositoryMetrics } from "@shared/esoteric";

const baseMetrics: RepositoryMetrics = {
  repositoryUrl: "https://github.com/acme/oracle",
  owner: "acme",
  name: "oracle",
  description: null,
  defaultBranch: "main",
  primaryLanguage: "TypeScript",
  languages: [{ name: "TypeScript", bytes: 100, percentage: 100 }],
  fileCount: 80,
  sourceFileCount: 50,
  testFileCount: 12,
  testRatio: 0.24,
  contributorCount: 3,
  recentCommitCount: 8,
  averageCommitsPerWeek: 2,
  directoryDepth: 3,
  averageSourceFileSize: 4500,
  largestSourceFileSize: 17000,
  complexityLevel: "low",
  complexityScore: 1,
  complexitySignals: ["The repository presents a compact, legible structural profile."],
  fetchedAt: "2026-08-20T00:00:00.000Z",
};

describe("EsotericCode mapping", () => {
  it("normalizes GitHub URLs and owner/repository shorthand", () => {
    expect(parseGitHubRepositoryUrl("acme/oracle")).toEqual({ owner: "acme", repo: "oracle", normalizedUrl: "https://github.com/acme/oracle" });
    expect(parseGitHubRepositoryUrl("https://github.com/acme/oracle.git/")).toMatchObject({ owner: "acme", repo: "oracle" });
  });

  it("draws The Tower and the Abysmal for high complexity with sparse tests", () => {
    const result = createDivination({ ...baseMetrics, complexityLevel: "high", complexityScore: 6, testRatio: 0.02, testFileCount: 1 });
    expect(result.tarot[1]?.cardName).toBe("The Tower");
    expect(result.iching.number).toBe(29);
  });

  it("draws The World for a broad contributor field", () => {
    const result = createDivination({ ...baseMetrics, contributorCount: 12 });
    expect(result.tarot[0]?.cardName).toBe("The World");
  });
});
