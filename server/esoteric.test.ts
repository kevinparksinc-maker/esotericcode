import { describe, expect, it } from "vitest";
import { createDivination, parseGitHubRepositoryUrl } from "./esoteric";
import { I_CHING_HEXAGRAMS, TAROT_DECK, drawCompleteTarot, selectCompleteHexagram } from "./divination-library";
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
});
