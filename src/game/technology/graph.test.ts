import { describe, expect, it } from "vitest";
import {
  canEmerge,
  validateTechnologyGraph,
  type TechnologyDefinition,
} from "./graph";

const definitions: TechnologyDefinition[] = [
  { id: "internet", requires: [] },
  { id: "payment", requires: [] },
  { id: "online-booking", requires: ["internet", "payment"] },
];

describe("technology prerequisite graph", () => {
  it("blocks online booking without every prerequisite", () => {
    expect(canEmerge(definitions[2].requires, new Set(["internet"]))).toBe(
      false,
    );
    expect(
      canEmerge(definitions[2].requires, new Set(["internet", "payment"])),
    ).toBe(true);
  });
  it("rejects missing references and cycles", () => {
    expect(() =>
      validateTechnologyGraph([{ id: "a", requires: ["missing"] }]),
    ).toThrow(/missing/);
    expect(() =>
      validateTechnologyGraph([
        { id: "a", requires: ["b"] },
        { id: "b", requires: ["a"] },
      ]),
    ).toThrow(/cycle/);
  });
});
