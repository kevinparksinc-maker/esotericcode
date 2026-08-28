import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ analyzeGitHubRepository: vi.fn(), createReadingPayload: vi.fn() }));
vi.mock("./repository-analysis", () => ({ analyzeGitHubRepository: mocks.analyzeGitHubRepository }));
vi.mock("./divination", () => ({ createReadingPayload: mocks.createReadingPayload }));
import { appRouter } from "./routers";

describe("anonymous public reading", () => {
  it("creates a reading payload without an EsotericCode session", async () => {
    const analysis = { metrics: { name: "oracle" }, architecture: { summary: "Visible evidence" } };
    const reading = { narrative: "A complete public reading" };
    mocks.analyzeGitHubRepository.mockResolvedValue(analysis);
    mocks.createReadingPayload.mockReturnValue(reading);
    const context = { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };

    await expect(appRouter.createCaller(context).repository.analyze({ repositoryUrl: "https://github.com/octocat/Hello-World" })).resolves.toEqual(reading);
    expect(mocks.analyzeGitHubRepository).toHaveBeenCalledWith("https://github.com/octocat/Hello-World", "public");
    expect(mocks.createReadingPayload).toHaveBeenCalledWith(analysis.metrics, analysis.architecture);
  });
});
