import { describe, expect, it } from "vitest";

describe("application configuration", () => {
  it("keeps the public application title configured", () => {
    expect(process.env.VITE_APP_TITLE).toBe("EsotericCode");
  });
});

export {};
