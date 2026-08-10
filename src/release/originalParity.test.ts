import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  isVerifiedOriginalTerm,
  VERIFIED_ORIGINAL_TERMS,
} from "./originalParity";

describe("original parity", () => {
  it("contains only the verified minimum audit terms", () => {
    expect(VERIFIED_ORIGINAL_TERMS).toEqual([
      "STELLEN",
      "SERVICE",
      "BANK",
      "WERBUNG",
      "HOTELS",
      "PREISE",
      "VERSICHERUNG",
      "VERTRAG",
      "ZEITUNG",
      "RENOV",
      "BANKROTT",
      "POOL",
    ]);
    expect(isVerifiedOriginalTerm("PREISE")).toBe(true);
    expect(isVerifiedOriginalTerm("UNVERIFIED")).toBe(false);
  });

  it("claims in the audit exactly the terms the code verifies", () => {
    const audit = readFileSync("docs/release/original-parity.md", "utf8");
    // The audit lists its terms as inline code, which is also how a new claim
    // would be written: an undocumented constant and an unsupported document
    // claim are the same failure seen from two sides.
    const documented = new Set(
      [...audit.matchAll(/`([A-ZÄÖÜ]+)`/g)].map(([, term]) => term),
    );
    expect([...documented].sort()).toEqual([...VERIFIED_ORIGINAL_TERMS].sort());
  });
});
