import type { IChingReading, RepositoryMetrics, TarotCard } from "@shared/esoteric";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  createReading: vi.fn(),
  storagePut: vi.fn(),
  extractUploadedZipMetrics: vi.fn(),
  createDivination: vi.fn(),
}));

vi.mock("./db", () => ({
  createReading: mocks.createReading,
  getReadingForUser: vi.fn(),
  getSharedReading: vi.fn(),
  listReadingsForUser: vi.fn(),
  shareReading: vi.fn(),
}));
vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));
vi.mock("./esoteric", () => ({
  extractRepositoryMetrics: vi.fn(),
  extractUploadedZipMetrics: mocks.extractUploadedZipMetrics,
  createDivination: mocks.createDivination,
}));

import { appRouter } from "./routers";

const metrics: RepositoryMetrics = {
  repositoryUrl: "upload://sample.zip", owner: "uploaded", name: "sample", description: "User-uploaded ZIP repository archive.", defaultBranch: "archive", primaryLanguage: null, languages: [], fileCount: 3, sourceFileCount: 1, testFileCount: 1, testRatio: 1, contributorCount: 1, recentCommitCount: 0, averageCommitsPerWeek: 0, directoryDepth: 1, averageSourceFileSize: 20, largestSourceFileSize: 20, complexityLevel: "low", complexityScore: 0, complexitySignals: ["Small archive"], repositoryCreatedAt: "2026-01-01T00:00:00.000Z", fetchedAt: "2026-01-01T00:00:00.000Z", source: { type: "zip", label: "Uploaded ZIP archive", originalFileName: "sample.zip" },
};
const tarot: TarotCard[] = [{ position: "Foundation", cardName: "The Magician", cardNumber: "I", suit: "major", metricTrigger: "Sample", mysticalInterpretation: "Sample", technicalActionable: "Sample" }];
const iching: IChingReading = { number: 1, name: "The Creative", chineseName: "乾 · Qián", classicalText: "Sample", developerInterpretation: "Sample", trigger: "Sample" };

function context(): TrpcContext {
  return {
    user: { id: 42, openId: "zip-user", name: "Zip User", email: "zip@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("readings.createFromZip", () => {
  beforeEach(() => {
    mocks.createReading.mockResolvedValue(501);
    mocks.storagePut.mockResolvedValue({ key: "repository-uploads/42/upload.zip", url: "https://storage.example/upload.zip" });
    mocks.extractUploadedZipMetrics.mockResolvedValue(metrics);
    mocks.createDivination.mockReturnValue({ tarot, iching, narrative: "A unified uploaded archive reading." });
  });

  it("accepts a ZIP payload and produces a persisted private reading with a secure storage reference", async () => {
    const caller = appRouter.createCaller(context());
    const archiveBase64 = Buffer.from([0x50, 0x4b, 0x03, 0x04]).toString("base64");
    await expect(caller.readings.createFromZip({ fileName: "sample.zip", archiveBase64 })).resolves.toEqual({ id: 501 });
    expect(mocks.extractUploadedZipMetrics).toHaveBeenCalledWith("sample.zip", expect.any(Buffer));
    expect(mocks.storagePut).toHaveBeenCalledWith(expect.stringMatching(/^repository-uploads\/42\//), expect.any(Buffer), "application/zip");
    expect(mocks.createReading).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, repositoryName: "sample", sourceFileKey: "repository-uploads/42/upload.zip", metrics, tarot, iching }));
  });
});
