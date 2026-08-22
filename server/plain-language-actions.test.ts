import { describe, expect, it } from "vitest";
import type { RepositoryMetrics } from "../shared/esoteric";
import { buildPlainLanguageActions } from "../shared/plain-language-actions";

function metrics(overrides: Partial<RepositoryMetrics> = {}): RepositoryMetrics {
  return {
    repositoryUrl: "https://github.com/example/repository",
    owner: "example",
    name: "repository",
    description: null,
    defaultBranch: "main",
    primaryLanguage: "TypeScript",
    languages: [],
    fileCount: 100,
    sourceFileCount: 80,
    testFileCount: 2,
    testRatio: 0.025,
    contributorCount: 1,
    recentCommitCount: 4,
    averageCommitsPerWeek: 1,
    directoryDepth: 4,
    averageSourceFileSize: 4000,
    largestSourceFileSize: 20_000,
    complexityLevel: "moderate",
    complexityScore: 3,
    complexitySignals: [],
    repositoryCreatedAt: "2026-01-01T00:00:00.000Z",
    fetchedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildPlainLanguageActions", () => {
  it("prioritizes a plain-English test baseline when test coverage is thin", () => {
    const actions = buildPlainLanguageActions(metrics());

    expect(actions).toHaveLength(3);
    expect(actions[0]).toMatchObject({
      step: "Start here",
      title: "Protect one important user path with tests",
    });
    expect(actions[0]?.action).toContain("Pick one action users rely on");
    expect(actions[0]?.example).toContain("main user flow");
    expect(actions[0]?.example.startsWith("For example:")).toBe(false);
  });

  it("recommends a focused structural change for a broad system with adequate tests", () => {
    const actions = buildPlainLanguageActions(metrics({
      testRatio: 0.25,
      complexityLevel: "high",
      sourceFileCount: 300,
    }));

    expect(actions[0]).toMatchObject({
      step: "Start here",
      title: "Make one busy area easier to change",
    });
    expect(actions.every(action => action.example.length > 20)).toBe(true);
  });
});
