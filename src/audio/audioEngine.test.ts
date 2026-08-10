import { describe, expect, it } from "vitest";
import { normalizeAudioSettings } from "./audioEngine";
describe("audio settings", () => {
  it("clamps buses independently", () => {
    expect(
      normalizeAudioSettings({
        master: 2,
        music: 0.5,
        ambience: -1,
        ui: 0.25,
        warnings: 4,
      }),
    ).toEqual({ master: 1, music: 0.5, ambience: 0, ui: 0.25, warnings: 1 });
  });
});
