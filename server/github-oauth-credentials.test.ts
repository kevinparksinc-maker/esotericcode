import { describe, expect, it } from "vitest";

describe("GitHub OAuth app credentials", () => {
  it("authenticates the registered OAuth client against GitHub’s rate-limit endpoint", async () => {
    const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
    expect(clientId, "GITHUB_OAUTH_CLIENT_ID must be configured").toBeTruthy();
    expect(clientSecret, "GITHUB_OAUTH_CLIENT_SECRET must be configured").toBeTruthy();
    const authorization = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch("https://api.github.com/rate_limit", { headers: { Accept: "application/vnd.github+json", Authorization: `Basic ${authorization}`, "User-Agent": "EsotericCode-oauth-validation" } });
    expect(response.status, "GitHub rejected the configured OAuth client credentials").toBe(200);
  }, 15_000);

  it("uses a reachable EsotericCode GitHub OAuth callback URL", async () => {
    const callbackUrl = process.env.GITHUB_OAUTH_REDIRECT_URI;
    expect(callbackUrl, "GITHUB_OAUTH_REDIRECT_URI must be configured").toBeTruthy();
    expect(callbackUrl, "GITHUB_OAUTH_REDIRECT_URI must be an HTTPS URL").toMatch(/^https:\/\//);
    expect(callbackUrl, "GITHUB_OAUTH_REDIRECT_URI must end at the GitHub callback route").toMatch(/\/api\/github-oauth\/callback$/);

    const response = await fetch(callbackUrl!, { redirect: "manual" });
    expect(response.status, "GitHub callback endpoint should reject an empty OAuth response with HTTP 302 or 400").toBeGreaterThanOrEqual(300);
    expect(response.status, "GitHub callback endpoint should be reachable").toBeLessThan(500);
  }, 15_000);

  it("is accepted by GitHub’s authorization endpoint", async () => {
    const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
    const callbackUrl = process.env.GITHUB_OAUTH_REDIRECT_URI;
    const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
    authorizeUrl.searchParams.set("client_id", clientId!);
    authorizeUrl.searchParams.set("redirect_uri", callbackUrl!);
    authorizeUrl.searchParams.set("scope", "repo");
    authorizeUrl.searchParams.set("state", "esotericcode-validation-state");

    const response = await fetch(authorizeUrl, { redirect: "manual" });
    expect(response.status, "GitHub rejected the configured OAuth client ID or redirect URI").toBe(302);
    expect(response.headers.get("location"), "GitHub should redirect to a sign-in or authorization page").toContain("github.com/login");
  }, 15_000);
});
