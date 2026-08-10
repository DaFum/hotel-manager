import { describe, expect, it } from "vitest";
import { ContentPackSchema } from "./contentPack";

describe("ContentPackSchema", () => {
  it("requires stable versions and typed entry families", () => {
    expect(
      ContentPackSchema.parse({
        packId: "core",
        schemaVersion: 1,
        contentVersion: "1991.1",
        entries: {},
      }).packId,
    ).toBe("core");
    expect(() =>
      ContentPackSchema.parse({
        packId: "",
        schemaVersion: 0,
        contentVersion: "",
        entries: {},
      }),
    ).toThrow();
  });
});
