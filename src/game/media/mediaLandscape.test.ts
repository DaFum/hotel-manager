import { describe, expect, it } from "vitest";
import { incidentReach } from "./mediaLandscape";
describe("media reach", () => {
  it("amplifies with digital adoption", () =>
    expect(incidentReach({ localPress: 6000 }, 20)).toBeLessThan(
      incidentReach(
        { localPress: 6000, reviewSites: 8000, socialMedia: 8000 },
        20,
      ),
    ));
});
