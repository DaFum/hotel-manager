import { describe, expect, it } from "vitest";
import { diagnosticsJson, sanitizeDiagnostics } from "./diagnosticsExport";
describe("diagnostics export", () => {
  it("removes free text and keeps deterministic technical state only", () => {
    expect(
      sanitizeDiagnostics({
        saveVersion: 8,
        stateHash: "abc",
        playerName: "Secret",
        freeText: "private",
      }),
    ).toEqual({ saveVersion: 8, stateHash: "abc" });
  });
  it("orders RNG stream keys and emits parseable local JSON", () => {
    const json = diagnosticsJson({
      saveVersion: 8,
      stateHash: "abc",
      rngState: { staffing: 2, guests: 1 },
    });
    expect(JSON.parse(json).rngState).toEqual({ guests: 1, staffing: 2 });
    expect(json).not.toContain("fetch");
  });
});
