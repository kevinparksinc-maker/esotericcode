import { describe, expect, it } from "vitest";
import { decryptGitHubToken, encryptGitHubToken } from "./github-crypto";

describe("GitHub token protection", () => {
  it("round-trips a token through authenticated encryption without retaining plaintext", () => {
    const token = "gho_private_example_token";
    const encrypted = encryptGitHubToken(token);
    expect(encrypted).not.toContain(token);
    expect(decryptGitHubToken(encrypted)).toBe(token);
  });

  it("rejects a tampered protected token payload", () => {
    const encrypted = encryptGitHubToken("gho_private_example_token");
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith("A") ? "B" : "A"}`;
    expect(() => decryptGitHubToken(tampered)).toThrow();
  });
});
