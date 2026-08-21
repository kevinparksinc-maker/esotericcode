import { randomBytes } from "node:crypto";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { encryptGitHubToken } from "./github-crypto";
import { sdk } from "./_core/sdk";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

function configured() {
  return Boolean(process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET && process.env.GITHUB_OAUTH_REDIRECT_URI);
}

export function getGitHubOAuthReturnPath(status: "connected" | "cancelled" | "error") {
  return `/?source=private&github=${status}`;
}

function redirectWithStatus(res: Response, status: "connected" | "cancelled" | "error") {
  res.redirect(302, getGitHubOAuthReturnPath(status));
}

export function registerGitHubOAuthRoutes(app: Express) {
  app.get("/api/github-oauth/start", async (req: Request, res: Response) => {
    if (!configured()) { res.status(503).json({ error: "GitHub OAuth has not been configured." }); return; }
    try {
      const user = await sdk.authenticateRequest(req);
      const state = randomBytes(32).toString("base64url");
      await db.createGitHubOAuthState(user.id, state, new Date(Date.now() + 10 * 60 * 1000));
      const target = new URL(GITHUB_AUTHORIZE_URL);
      target.searchParams.set("client_id", process.env.GITHUB_OAUTH_CLIENT_ID!);
      target.searchParams.set("redirect_uri", process.env.GITHUB_OAUTH_REDIRECT_URI!);
      target.searchParams.set("scope", "repo");
      target.searchParams.set("state", state);
      target.searchParams.set("allow_signup", "false");
      res.redirect(302, target.toString());
    } catch { res.redirect(302, "/?github=error"); }
  });

  app.get("/api/github-oauth/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;
    if (req.query.error || !code || !state || !configured()) { redirectWithStatus(res, req.query.error ? "cancelled" : "error"); return; }
    try {
      const stateRecord = await db.consumeGitHubOAuthState(state);
      if (!stateRecord) { redirectWithStatus(res, "error"); return; }
      const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "EsotericCode-oauth" },
        body: JSON.stringify({ client_id: process.env.GITHUB_OAUTH_CLIENT_ID, client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET, code, redirect_uri: process.env.GITHUB_OAUTH_REDIRECT_URI }),
      });
      const tokenPayload = await tokenResponse.json() as { access_token?: string; scope?: string; error?: string };
      if (!tokenResponse.ok || !tokenPayload.access_token) throw new Error("GitHub token exchange failed.");
      const identityResponse = await fetch(GITHUB_USER_URL, { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${tokenPayload.access_token}`, "User-Agent": "EsotericCode-oauth" } });
      const identity = await identityResponse.json() as { login?: string };
      if (!identityResponse.ok || !identity.login) throw new Error("GitHub user lookup failed.");
      await db.upsertGitHubConnection(stateRecord.userId, identity.login, encryptGitHubToken(tokenPayload.access_token), tokenPayload.scope ?? null);
      redirectWithStatus(res, "connected");
    } catch (error) {
      console.error("[GitHub OAuth] Callback failed", error instanceof Error ? error.message : "unknown error");
      redirectWithStatus(res, "error");
    }
  });
}
