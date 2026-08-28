import { describe, expect, it } from "vitest";
import type { ArchitectureEvidence, RepositoryMetrics } from "@shared/esoteric";
import { createReadingPayload } from "./divination";

const metrics: RepositoryMetrics = { repositoryUrl: "https://github.com/octo/oracle", owner: "octo", name: "oracle", defaultBranch: "main", description: null, primaryLanguage: "TypeScript", fileCount: 72, sourceFileCount: 50, testFileCount: 2, testRatio: 0.04, directoryDepth: 7, largestFileBytes: 60000, contributorCount: 3, recentCommitCount: 9, complexityScore: 8, complexityLevel: "high", source: "public", fetchedAt: "2026-08-28T00:00:00.000Z" };
const architecture: ArchitectureEvidence = { summary: "A bounded test scan mapped the visible tree.", topModules: [{ path: "server", files: 25 }], entryPoints: ["server/index.ts"], fileCategories: [{ label: "Source", count: 50 }], observations: ["The server module is dominant."] };

describe("deterministic divination", () => {
  it("turns repository evidence into a complete visible reading", () => {
    const reading = createReadingPayload(metrics, architecture);
    expect(reading.tarot).toHaveLength(3);
    expect(reading.tarot[1]).toMatchObject({ name: "The Tower", position: "Tension", orientation: "reversed" });
    expect(reading.iching).toMatchObject({ number: 29, name: "The Abysmal" });
    expect(reading.kpChart.activeHouse.number).toBeGreaterThanOrEqual(1);
    expect(reading.actions).toHaveLength(3);
    expect(reading.actions[0].step).toBe("Start here");
    expect(reading.narrative).toContain("octo/oracle");
  });
});
