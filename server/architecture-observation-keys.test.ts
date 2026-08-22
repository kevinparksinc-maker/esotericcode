import { describe, expect, it } from "vitest";
import { getArchitectureObservationKey } from "../client/src/lib/architectureObservationKeys";

describe("getArchitectureObservationKey", () => {
  it("keeps repeated module summaries distinct", () => {
    const duplicate = { module: "client", summary: "Structural scan of client." };

    expect(getArchitectureObservationKey(duplicate, 0)).not.toBe(
      getArchitectureObservationKey(duplicate, 1),
    );
  });

  it("is stable for the same observation position", () => {
    const observation = { module: "server", summary: "Structural scan of server." };

    expect(getArchitectureObservationKey(observation, 2)).toBe(
      getArchitectureObservationKey(observation, 2),
    );
  });
});
