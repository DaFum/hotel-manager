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
});
