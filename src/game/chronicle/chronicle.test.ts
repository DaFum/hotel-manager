import { describe, expect, it } from "vitest";
import { appendChronicleEntry } from "./chronicle";
describe("chronicle", () => {
  it("deduplicates and orders stable history", () => {
    const e = {
      id: "1",
      date: "1997-01-01",
      scope: "company" as const,
      textKey: "opening",
    };
    expect(appendChronicleEntry([e], e)).toEqual([e]);
  });
});
