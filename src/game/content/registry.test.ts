import { describe, expect, it } from "vitest";
import { ContentRegistry } from "./registry";

describe("ContentRegistry", () => {
  it("rejects duplicates and provides stable deterministic iteration", () => {
    const registry = new ContentRegistry();
    registry.add({ id: "city.frankfurt.de", kind: "city" });
    expect(() =>
      registry.add({ id: "city.frankfurt.de", kind: "city" }),
    ).toThrow(/duplicate/i);
    registry.add({ id: "brand.alpine", kind: "brand" });
    expect(registry.all().map(({ id }) => id)).toEqual([
      "brand.alpine",
      "city.frankfurt.de",
    ]);
  });

  it("deep-freezes normalized records so runtime cannot mutate pack content", () => {
    const registry = new ContentRegistry();
    registry.add({
      id: "tech.internet",
      kind: "technology",
      refs: ["tech.pc"],
    });
    const record = registry.get("tech.internet") as {
      id: string;
      kind: string;
      refs: string[];
    };
    expect(() => record.refs.push("tech.wifi")).toThrow();
  });

  it("refuses a caller that asks for the wrong content family", () => {
    const registry = new ContentRegistry();
    registry.add({ id: "city.frankfurt", kind: "city" });
    expect(() => registry.getByKind("city.frankfurt", "brand")).toThrow(
      /not brand/,
    );
  });
});
