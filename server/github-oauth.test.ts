import { describe, expect, it } from "vitest";
import { getGitHubOAuthReturnPath } from "./github-oauth";

describe("GitHub OAuth callback redirects", () => {
  it("returns successful authorization to the Private GitHub intake", () => {
    expect(getGitHubOAuthReturnPath("connected")).toBe("/?source=private&github=connected");
  });

  it("keeps cancelled and failed authorization recovery in the Private GitHub intake", () => {
    expect(getGitHubOAuthReturnPath("cancelled")).toBe("/?source=private&github=cancelled");
    expect(getGitHubOAuthReturnPath("error")).toBe("/?source=private&github=error");
  });
});
