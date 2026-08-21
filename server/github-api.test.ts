import { afterEach, describe, expect, it, vi } from "vitest";
import { listConnectedGitHubRepositories } from "./github-api";

describe("connected GitHub repository discovery", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the encrypted connection only as a server-side bearer header and normalizes repository choices", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ full_name: "octo/private-oracle", name: "private-oracle", private: true, description: "A private codebase", default_branch: "main", updated_at: "2026-08-21T00:00:00Z", language: "TypeScript", owner: { login: "octo" } }]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(listConnectedGitHubRepositories("server-only-token")).resolves.toEqual([{ fullName: "octo/private-oracle", name: "private-oracle", owner: "octo", private: true, description: "A private codebase", defaultBranch: "main", updatedAt: "2026-08-21T00:00:00Z", language: "TypeScript" }]);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/user/repos"), expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer server-only-token" }) }));
  });

  it("does not disguise a revoked connection as an empty repository list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "Bad credentials" }), { status: 401 })));
    await expect(listConnectedGitHubRepositories("expired-token")).rejects.toThrow("expired or was revoked");
  });
});
