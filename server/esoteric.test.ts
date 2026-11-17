import { describe, expect, it } from "vitest";
import { createDivination, parseGitHubRepositoryUrl } from "./esoteric";
import { castFromCode, castCompleteIChing, createSignalProfile, I_CHING_HEXAGRAMS, TAROT_DECK, drawCompleteTarot, selectCompleteHexagram } from "./divination-library";
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

  it("casts independently of diagnosis and supports exact replay", () => {
    const nonce = "a".repeat(64);
    const normal = castFromCode(baseMetrics, nonce);
    const stressed = castFromCode({ ...baseMetrics, complexityLevel: "high", complexityScore: 6, testRatio: 0.02 }, nonce);
    expect(stressed.tarot).toEqual(normal.tarot);
    expect(stressed.iching).toEqual(normal.iching);
    expect(stressed.record).toEqual(normal.record);
    expect(normal.record.algorithm).toBe("code-seeded-sha256-v1");
    expect(new Set(normal.record.tarotIndices).size).toBe(3);
    expect(normal.record.ichingCoins).toHaveLength(6);
    expect(normal.record.ichingCoins.every(coins => coins.length === 3 && coins.every(coin => coin === 2 || coin === 3))).toBe(true);
  });

  it("contains the complete 78-card Tarot deck and all 64 canonical hexagrams", () => {
    expect(TAROT_DECK).toHaveLength(78);
    expect(new Set(TAROT_DECK.map(card => card.id)).size).toBe(78);
    expect(TAROT_DECK.filter(card => card.suit === "major")).toHaveLength(22);
    expect(TAROT_DECK.filter(card => card.suit !== "major")).toHaveLength(56);
    expect(I_CHING_HEXAGRAMS).toHaveLength(64);
    expect(I_CHING_HEXAGRAMS.map(hexagram => hexagram.number)).toEqual(Array.from({ length: 64 }, (_, index) => index + 1));
  });

  it("produces different casts from fresh nonces while preserving audit-independent results", () => {
    const first = castFromCode(baseMetrics, "1".repeat(64));
    const next = castFromCode(baseMetrics, "2".repeat(64));
    expect(first.record.seed).not.toBe(next.record.seed);
    expect(first.record).not.toEqual(next.record);
    expect(first.tarot.every(card => card.orientation === "upright" || card.orientation === "reversed")).toBe(true);
    const live = createDivination({ ...baseMetrics });
    expect(live.tarot).toHaveLength(3);
    expect(live.iching.cast?.lines).toHaveLength(6);
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

  it("casts six three-coin I Ching lines and derives the relating hexagram by changing lines", () => {
    const cast = castCompleteIChing(baseMetrics);
    expect(cast.cast?.lines).toHaveLength(6);
    expect(cast.cast?.lines.map(line => line.position)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(cast.cast?.lines.every(line => [6, 7, 8, 9].includes(line.value))).toBe(true);
    expect(cast.cast?.relatingHexagram === undefined).toBe(cast.cast?.changingLineNumbers.length === 0);
    expect(cast.cast?.method).toBe("code-fingerprint three-coin casting");
  });

  it("maps full-tree architecture evidence into the divination signal profile and KP chart", () => {
    const architecture = {
      analysisMode: "bounded full-tree architecture scan" as const,
      auditFindings: [], auditMethod: "offline heuristic code audit" as const,
      coverage: { repositoryFiles: 220, inspectedTextFiles: 130, excludedNoiseFiles: 30, contentBatches: 4, unprocessedTextFiles: 0 },
      categoryCounts: { source: 78, test: 18, config: 9, documentation: 4, manifest: 2, migration: 3, infrastructure: 2, other: 14 },
      topLevelModules: [], entryPoints: ["src/main.ts"], importEdges: Array.from({ length: 84 }, (_, index) => ({ from: `src/${index}.ts`, to: "./shared" })), dependencyCount: 12, dependencies: [], testDirectories: ["tests"], maintenanceMarkers: { todo: 18, fixme: 7, deprecated: 2 }, largestFiles: [], recency: { recentCommitCount: 12, mostRecentCommitAt: "2026-08-20T00:00:00.000Z", recentlyTouchedFiles: [{ path: "src/main.ts", lastCommitAt: "2026-08-20T00:00:00.000Z" }] }, moduleSummaries: [], unifiedSummary: "A heavily connected repository with visible maintenance debt.", synthesisMethod: "local static evidence followed by one Gemini interpretation" as const,
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
