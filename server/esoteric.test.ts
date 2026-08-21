import { describe, expect, it } from "vitest";
import { createDivination, parseGitHubRepositoryUrl } from "./esoteric";
import { castCompleteIChing, createSignalProfile, I_CHING_HEXAGRAMS, TAROT_DECK, drawCompleteTarot, selectCompleteHexagram } from "./divination-library";
import { createRepositoryKpChart } from "./kp-astrology";
import { classifyRepositoryFile } from "./repository-analysis";
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
  repositoryCreatedAt: "2023-01-15T10:30:00.000Z",
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

  it("contains the complete 78-card Tarot deck and all 64 canonical hexagrams", () => {
    expect(TAROT_DECK).toHaveLength(78);
    expect(new Set(TAROT_DECK.map(card => card.id)).size).toBe(78);
    expect(TAROT_DECK.filter(card => card.suit === "major")).toHaveLength(22);
    expect(TAROT_DECK.filter(card => card.suit !== "major")).toHaveLength(56);
    expect(I_CHING_HEXAGRAMS).toHaveLength(64);
    expect(I_CHING_HEXAGRAMS.map(hexagram => hexagram.number)).toEqual(Array.from({ length: 64 }, (_, index) => index + 1));
  });

  it("varies complete-library draws across materially different repository signals", () => {
    const stable = drawCompleteTarot({ ...baseMetrics, repositoryUrl: "https://github.com/acme/stable", testRatio: 0.35, contributorCount: 2, recentCommitCount: 2 });
    const active = drawCompleteTarot({ ...baseMetrics, repositoryUrl: "https://github.com/acme/active", recentCommitCount: 22, contributorCount: 10, sourceFileCount: 400, complexityLevel: "moderate", complexityScore: 3 });
    expect(stable.map(card => card.cardName)).not.toEqual(active.map(card => card.cardName));
    expect(selectCompleteHexagram({ ...baseMetrics, repositoryUrl: "https://github.com/acme/active", recentCommitCount: 18 }).number).toBe(1);
    expect(selectCompleteHexagram({ ...baseMetrics, repositoryUrl: "https://github.com/acme/quiet", recentCommitCount: 1, testRatio: 0.1, testFileCount: 5 }).number).toBe(2);
  });

  it("supplies upright and reversed expressions for the complete deck", () => {
    expect(TAROT_DECK.every(card => Boolean(card.reversedInterpretation && card.reversedAction))).toBe(true);
    const stressed = createDivination({
      ...baseMetrics,
      repositoryUrl: "https://github.com/acme/stressed",
      complexityLevel: "high",
      complexityScore: 6,
      testRatio: 0.02,
      testFileCount: 1,
      recentCommitCount: 17,
    });
    expect(stressed.tarot[1]).toMatchObject({ cardName: "The Tower", orientation: "reversed" });
    expect(stressed.tarot[1]?.orientationEvidence).toContain("Reversed:");
    expect(stressed.tarot.every(card => card.orientation === "upright" || card.orientation === "reversed")).toBe(true);
  });

  it("builds a deterministic repository KP chart with Tarot and I Ching bridges", () => {
    const complexMetrics = { ...baseMetrics, complexityLevel: "high" as const, complexityScore: 6, testRatio: 0.03, testFileCount: 1, repositoryCreatedAt: "2021-04-05T08:12:00.000Z" };
    const first = createRepositoryKpChart(complexMetrics);
    const second = createRepositoryKpChart(complexMetrics);
    expect(first).toEqual(second);
    expect(first.framework).toBe("Repository symbolic chart");
    expect(first.activeHouse.number).toBe(8);
    expect(first.significators.length).toBeGreaterThanOrEqual(2);
    expect(first.tarotBridge.length).toBeGreaterThan(1);
    expect(first.ichingBridge.length).toBeGreaterThan(1);
    expect(first.disclaimer).toContain("not a personal natal chart");
  });

  it("casts all six I Ching lines and creates a relating hexagram only when lines change", () => {
    const changing = castCompleteIChing({ ...baseMetrics, repositoryUrl: "https://github.com/acme/volatile", complexityLevel: "high", complexityScore: 6, testRatio: 0.02, testFileCount: 1, recentCommitCount: 18 });
    expect(changing.cast?.lines).toHaveLength(6);
    expect(changing.cast?.lines.map(line => line.position)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(changing.cast?.lines.every(line => [6, 7, 8, 9].includes(line.value))).toBe(true);
    expect(changing.cast?.lines.every(line => Boolean(line.interpretation))).toBe(true);
    expect(changing.cast?.mode).toBe("changing");
    expect(changing.cast?.relatingHexagram).toBeDefined();
    expect(changing.cast?.changingLineNumbers.length).toBeGreaterThan(0);

    const staticCast = Array.from({ length: 200 }, (_, index) => castCompleteIChing({ ...baseMetrics, repositoryUrl: `https://github.com/acme/static-${index}`, complexityLevel: "low", complexityScore: 0, testRatio: 0.4, recentCommitCount: 1 }))
      .find(reading => reading.cast?.mode === "static");
    expect(staticCast?.cast?.changingLineNumbers).toEqual([]);
    expect(staticCast?.cast?.relatingHexagram).toBeUndefined();
    expect(staticCast?.cast?.transformationSummary).toContain("static reading");
  });

  it("maps full-tree architecture evidence into the divination signal profile and KP chart", () => {
    const architecture = {
      analysisMode: "bounded full-tree architecture scan" as const,
      coverage: { repositoryFiles: 220, inspectedTextFiles: 130, excludedNoiseFiles: 30, contentBatches: 4, unprocessedTextFiles: 0 },
      categoryCounts: { source: 78, test: 18, config: 9, documentation: 4, manifest: 2, migration: 3, infrastructure: 2, other: 14 },
      topLevelModules: [], entryPoints: ["src/main.ts"], importEdges: Array.from({ length: 84 }, (_, index) => ({ from: `src/${index}.ts`, to: "./shared" })), dependencyCount: 12, dependencies: [], testDirectories: ["tests"], maintenanceMarkers: { todo: 18, fixme: 7, deprecated: 2 }, largestFiles: [], recency: { recentCommitCount: 12, mostRecentCommitAt: "2026-08-20T00:00:00.000Z", recentlyTouchedFiles: [{ path: "src/main.ts", lastCommitAt: "2026-08-20T00:00:00.000Z" }] }, moduleSummaries: [], unifiedSummary: "A heavily connected repository with visible maintenance debt.", synthesisMethod: "batched module summaries followed by one unified synthesis" as const,
    };
    const profile = createSignalProfile({ ...baseMetrics, architecture });
    expect(profile.complexity).toBeGreaterThan(createSignalProfile(baseMetrics).complexity);
    expect(profile.maintenance).toBeGreaterThan(createSignalProfile(baseMetrics).maintenance);
    expect(createRepositoryKpChart({ ...baseMetrics, architecture }).activeHouse.number).toBe(8);
    expect(classifyRepositoryFile("src/app.ts")).toBe("source");
    expect(classifyRepositoryFile(".github/workflows/ci.yml")).toBe("infrastructure");
    expect(classifyRepositoryFile("db/migrations/001_init.sql")).toBe("migration");
    expect(classifyRepositoryFile("docs/architecture.md")).toBe("documentation");
  });
});
